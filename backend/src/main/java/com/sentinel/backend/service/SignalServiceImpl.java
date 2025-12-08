package com.sentinel.backend.service;

import com.sentinel.backend.dto.*;
import com.sentinel.backend.entity.*;
import com.sentinel.backend.model.SignalType;
import com.sentinel.backend.repository.*;
import com.sentinel.backend.util.NormalizationUtils;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class SignalServiceImpl implements SignalService {

    private final SignalRepository signalRepository;
    private final PollRepository pollRepository;
    private final PollResultRepository pollResultRepository;

    // CREATE POLL
    @Override
    @Transactional
    public CreatePollResponse createPoll(PollCreateDTO dto) {
        dto.normalizeCommon();
        dto.normalizePoll();
        dto.validateCommon();
        dto.validatePoll();

        // 1. Duplicate check: question (normalized) + options (normalized sorted)
        String incomingQ = NormalizationUtils.normalizeQuestion(dto.getQuestion());
        List<String> incomingOpts = NormalizationUtils.normalizeForComparison(dto.getOptions());

        List<Poll> allPolls = pollRepository.findAll();
        for (Poll p : allPolls) {
            String existingQ = NormalizationUtils.normalizeQuestion(p.getQuestion());
            if (!incomingQ.equals(existingQ)) continue;
            List<String> existOpts = NormalizationUtils.normalizeForComparison(p.getOptions());
            if (incomingOpts.equals(existOpts)) {
                throw new IllegalArgumentException("A poll with the same question and options already exists.");
            }
        }

        // 2. Save Signal
        Signal s = new Signal();
        s.setCreatedBy(dto.getCreatedBy());
        s.setAnonymous(dto.getAnonymous());
        s.setEndTimestamp(dto.parseEndTimestamp());
        s.setTypeOfSignal(dto.getType());
        s.setDefaultFlag(Boolean.TRUE.equals(dto.getDefaultFlag()));
        s.setDefaultOption(dto.getDefaultOption());
        s.setSharedWith(dto.getSharedWith());

        Signal saved = signalRepository.save(s);

        // 3. Save poll
        Poll poll = new Poll();
        poll.setSignal(saved);
        poll.setQuestion(dto.getQuestion().trim());
        poll.setOptions(dto.getOptions());
        pollRepository.save(poll);

        CreatePollResponse resp = new CreatePollResponse();
        resp.setCloudSignalId(saved.getId());
        return resp;
    }

    // Get assigned polls for user (non-expensive simple method)
    @Override
    public List<UserPollDTO> getAssignedPollsForUser(String userId) {
        // fetch signals where userId in shared_with and type=POLL and not deleted
        List<Signal> signals = signalRepository.findAll()
                .stream()
                .filter(s -> Arrays.asList(s.getSharedWith()).contains(userId))
                .collect(Collectors.toList());

        List<UserPollDTO> out = new ArrayList<>();
        for (Signal s : signals) {
            Optional<Poll> pOpt = pollRepository.findById(s.getId());
            if (pOpt.isEmpty()) continue;
            Poll p = pOpt.get();
            UserPollDTO dto = new UserPollDTO();
            dto.setCloudSignalId(s.getId());
            dto.setQuestion(p.getQuestion());
            dto.setOptions(p.getOptions());
            dto.setAnonymous(s.getAnonymous());
            dto.setEndTimestamp(s.getEndTimestamp());
            dto.setDefaultOption(s.getDefaultOption());
            out.add(dto);
        }
        return out;
    }

    // ensure defaults inserted for expired signals (idempotent)
    @Transactional
    protected void ensureDefaultsForExpired(Integer signalId) {
        Signal s = signalRepository.findById(signalId).orElse(null);
        if (s == null) return;

        Instant now = Instant.now();
        if (s.getEndTimestamp() == null || now.isBefore(s.getEndTimestamp())) return; // not expired

        // for each user in shared_with not present in poll_result, insert default
        String[] assigned = s.getSharedWith();
        List<PollResult> existing = pollResultRepository.findBySignalId(signalId);
        Set<String> responded = existing.stream().map(PollResult::getUserId).collect(Collectors.toSet());

        List<PollResult> toInsert = new ArrayList<>();
        for (String uid : assigned) {
            if (!responded.contains(uid)) {
                PollResult pr = new PollResult();
                pr.setSignalId(signalId);
                pr.setUserId(uid);
                pr.setSelectedOption(s.getDefaultOption() == null ? "" : s.getDefaultOption());
                pr.setTimeOfSubmission(s.getEndTimestamp());
                toInsert.add(pr);
            }
        }
        if (!toInsert.isEmpty()) pollResultRepository.saveAll(toInsert);
    }

    // SUBMIT / UPDATE VOTE
    @Override
    @Transactional
    public void submitOrUpdateVote(SubmitPollRequest req) {
        req.normalize();
        // validate signal
        Signal s = signalRepository.findById(req.getSignalId())
                .orElseThrow(() -> new IllegalArgumentException("Invalid signalId. Poll does not exist."));

        // if expired -> ensure defaults applied and reject submissions
        if (s.getEndTimestamp() != null && Instant.now().isAfter(s.getEndTimestamp())) {
            ensureDefaultsForExpired(req.getSignalId());
            throw new IllegalArgumentException("Poll is closed for submissions; default responses have been applied.");
        }

        // check user assignment
        if (!Arrays.asList(s.getSharedWith()).contains(req.getUserId())) {
            throw new IllegalArgumentException("User is not assigned to this poll");
        }

        // validate poll & option: exact match
        Poll poll = pollRepository.findById(req.getSignalId())
                .orElseThrow(() -> new IllegalArgumentException("Poll data not found"));

        boolean validOption = Arrays.asList(poll.getOptions()).contains(req.getSelectedOption());
        if (!validOption) throw new IllegalArgumentException("Selected option is invalid");

        // upsert
        Optional<PollResult> existing = pollResultRepository.findBySignalIdAndUserId(req.getSignalId(), req.getUserId());
        if (existing.isPresent()) {
            PollResult pr = existing.get();
            pr.setSelectedOption(req.getSelectedOption());
            pr.setTimeOfSubmission(Instant.now());
            pollResultRepository.save(pr);
        } else {
            PollResult pr = new PollResult();
            pr.setSignalId(req.getSignalId());
            pr.setUserId(req.getUserId());
            pr.setSelectedOption(req.getSelectedOption());
            pr.setTimeOfSubmission(Instant.now());
            pollResultRepository.save(pr);
        }
    }

    // GET RESULTS (applies defaults first if expired)
    @Override
    @Transactional
    public PollResultDTO getPollResults(Integer signalId) {
        Signal s = signalRepository.findById(signalId)
                .orElseThrow(() -> new IllegalArgumentException("Poll not found"));

        // apply defaults if expired
        ensureDefaultsForExpired(signalId);

        Poll poll = pollRepository.findById(signalId)
                .orElseThrow(() -> new IllegalArgumentException("Poll data not found"));

        List<PollResult> results = pollResultRepository.findBySignalId(signalId);

        Map<String, Integer> counts = new LinkedHashMap<>();
        Map<String, List<String>> optionToUsers = new LinkedHashMap<>();
        for (String opt : poll.getOptions()) {
            counts.put(opt, 0);
            optionToUsers.put(opt, new ArrayList<>());
        }

        for (PollResult r : results) {
            counts.put(r.getSelectedOption(), counts.getOrDefault(r.getSelectedOption(), 0) + 1);
            if (optionToUsers.containsKey(r.getSelectedOption())) {
                optionToUsers.get(r.getSelectedOption()).add(r.getUserId());
            } else {
                // if result contains an option no longer present, still store under that label
                optionToUsers.computeIfAbsent(r.getSelectedOption(), k -> new ArrayList<>()).add(r.getUserId());
                counts.putIfAbsent(r.getSelectedOption(), 1);
            }
        }

        PollResultDTO dto = new PollResultDTO();
        dto.setSignalId(signalId);
        dto.setTotalAssigned(s.getSharedWith().length);
        dto.setTotalResponded(results.size());
        dto.setOptionCounts(counts);
        dto.setOptionToUsers(Boolean.TRUE.equals(s.getAnonymous()) ? null :
                optionToUsers.entrySet().stream()
                        .collect(Collectors.toMap(Map.Entry::getKey, e -> e.getValue().toArray(new String[0]))));
        return dto;
    }

    // EDIT & REPUBLISH - simplified using PollCreateDTO fields
    @Override
    @Transactional
    public void editSignal(Integer signalId, boolean republish, PollCreateDTO dto) {
        dto.normalizeCommon();
        dto.normalizePoll();
        dto.validateCommon();
        dto.validatePoll();

        Signal s = signalRepository.findById(signalId)
                .orElseThrow(() -> new IllegalArgumentException("Signal not found"));
        Poll poll = pollRepository.findById(signalId)
                .orElseThrow(() -> new IllegalArgumentException("Poll not found"));

        // Duplicate check like create (skip self)
        String incomingQ = NormalizationUtils.normalizeQuestion(dto.getQuestion());
        List<String> incomingOpts = NormalizationUtils.normalizeForComparison(dto.getOptions());
        List<Poll> all = pollRepository.findAll();
        for (Poll p : all) {
            if (p.getSignalId().equals(signalId)) continue;
            if (NormalizationUtils.normalizeQuestion(p.getQuestion()).equals(incomingQ)) {
                List<String> exist = NormalizationUtils.normalizeForComparison(p.getOptions());
                if (exist.equals(incomingOpts)) throw new IllegalArgumentException("A poll with same question/options exists.");
            }
        }

        // Apply changes
        poll.setQuestion(dto.getQuestion().trim());
        poll.setOptions(dto.getOptions());
        s.setAnonymous(dto.getAnonymous());
        s.setDefaultFlag(Boolean.TRUE.equals(dto.getDefaultFlag()));
        s.setDefaultOption(dto.getDefaultOption());
        s.setEndTimestamp(dto.parseEndTimestamp());
        s.setSharedWith(dto.getSharedWith());
        s.setLastEdited(Instant.now());

        pollRepository.save(poll);
        signalRepository.save(s);

        // republish -> delete existing results so users must re-answer
        if (republish) {
            List<PollResult> existing = pollResultRepository.findBySignalId(signalId);
            if (!existing.isEmpty()) pollResultRepository.deleteAll(existing);
        }
    }

    @Override
    @Transactional
    public void deleteSignal(Integer signalId) {
        if (!signalRepository.existsById(signalId)) throw new IllegalArgumentException("Signal not found");
        signalRepository.deleteById(signalId);
    }
}
