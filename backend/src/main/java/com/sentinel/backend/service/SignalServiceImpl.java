package com.sentinel.backend.service;

import com.sentinel.backend.dto.CreatePollResponse;
import com.sentinel.backend.dto.PollCreateDTO;
import com.sentinel.backend.dto.PollResultDTO;
import com.sentinel.backend.dto.SubmitPollRequest;
import com.sentinel.backend.entity.Poll;
import com.sentinel.backend.entity.PollResult;
import com.sentinel.backend.entity.Signal;
import com.sentinel.backend.exception.BadRequestException;
import com.sentinel.backend.exception.ConflictException;
import com.sentinel.backend.exception.NotFoundException;
import com.sentinel.backend.repository.PollRepository;
import com.sentinel.backend.repository.PollResultRepository;
import com.sentinel.backend.repository.SignalRepository;
import com.sentinel.backend.util.NormalizationUtils;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class SignalServiceImpl implements SignalService {

    private final SignalRepository signalRepository;
    private final PollRepository pollRepository;
    private final PollResultRepository pollResultRepository;

    // -------------------------------------------------------------------------
    // CREATE POLL
    // -------------------------------------------------------------------------
    @Override
    @Transactional
    public CreatePollResponse createPoll(PollCreateDTO dto) {

        dto.normalizeCommon();
        dto.normalizePoll();
        dto.validateCommon();
        dto.validatePoll();

        // ---- 1. Duplicate question + options check ----
        String incomingQ = NormalizationUtils.normalizeQuestion(dto.getQuestion());
        List<String> incomingOpts =
                NormalizationUtils.normalizeForComparison(dto.getOptions());

        for (Poll p : pollRepository.findAll()) {
            String existingQ = NormalizationUtils.normalizeQuestion(p.getQuestion());
            if (!incomingQ.equals(existingQ)) continue;

            List<String> existOpts =
                    NormalizationUtils.normalizeForComparison(p.getOptions());

            if (incomingOpts.equals(existOpts)) {
                throw new ConflictException("A poll with the same question and options already exists.");
            }
        }

        // ---- 2. Create Signal ----
        Signal s = new Signal();
        s.setCreatedBy(dto.getCreatedBy());
        s.setAnonymous(dto.getAnonymous());
        s.setEndTimestamp(dto.parseEndTimestamp());
        s.setTypeOfSignal(dto.getType());
        s.setDefaultFlag(Boolean.TRUE.equals(dto.getDefaultFlag()));
        s.setDefaultOption(dto.getDefaultOption());
        s.setSharedWith(dto.getSharedWith());

        Signal saved = signalRepository.save(s);

        // ---- 3. Create Poll ----
        Poll poll = new Poll();
        poll.setSignal(saved);
        poll.setQuestion(dto.getQuestion().trim());
        poll.setOptions(dto.getOptions());
        pollRepository.save(poll);

        // ---- 4. Response ----
        return new CreatePollResponse(saved.getId(), dto.getLocalId());
    }

    // -------------------------------------------------------------------------
    // AUTO DEFAULT FILL FOR EXPIRED SIGNALS
    // -------------------------------------------------------------------------
    @Transactional
    protected void ensureDefaultsForExpired(Integer signalId) {

        Signal s = signalRepository.findById(signalId).orElse(null);
        if (s == null) return;

        Instant now = Instant.now();
        if (s.getEndTimestamp() == null || now.isBefore(s.getEndTimestamp())) return;

        // Assign default responses to missing users
        Set<String> respondedUsers =
                pollResultRepository.findBySignalId(signalId)
                        .stream()
                        .map(PollResult::getUserId)
                        .collect(Collectors.toSet());

        List<PollResult> toInsert = new ArrayList<>();

        for (String uid : s.getSharedWith()) {
            if (!respondedUsers.contains(uid)) {
                PollResult pr = new PollResult();
                pr.setSignalId(signalId);
                pr.setUserId(uid);
                pr.setSelectedOption(s.getDefaultOption());
                pr.setTimeOfSubmission(s.getEndTimestamp());
                toInsert.add(pr);
            }
        }

        if (!toInsert.isEmpty()) {
            pollResultRepository.saveAll(toInsert);
        }
    }

    // -------------------------------------------------------------------------
    // SUBMIT RESPONSE
    // -------------------------------------------------------------------------
    @Override
    @Transactional
    public void submitOrUpdateVote(SubmitPollRequest req) {

        req.normalize();

        Signal s = signalRepository.findById(req.getSignalId())
                .orElseThrow(() -> new NotFoundException("Signal not found"));

        // ---- If expired → apply defaults & reject ----
        if (s.getEndTimestamp() != null && Instant.now().isAfter(s.getEndTimestamp())) {
            ensureDefaultsForExpired(req.getSignalId());
            throw new BadRequestException("Poll is closed for submissions.");
        }

        // ---- Validate Assigned User ----
        if (!Arrays.asList(s.getSharedWith()).contains(req.getUserId())) {
            throw new BadRequestException("User is not assigned to this poll.");
        }

        // ---- Validate Options ----
        Poll poll = pollRepository.findById(req.getSignalId())
                .orElseThrow(() -> new NotFoundException("Poll data not found"));

        boolean valid = Arrays.asList(poll.getOptions())
                .contains(req.getSelectedOption()); // ❗ EXACT match only

        if (!valid) {
            throw new BadRequestException("Selected option is invalid.");
        }

        // ---- UPSERT Response ----
        Optional<PollResult> existing =
                pollResultRepository.findBySignalIdAndUserId(req.getSignalId(), req.getUserId());

        PollResult pr = existing.orElseGet(PollResult::new);

        pr.setSignalId(req.getSignalId());
        pr.setUserId(req.getUserId());
        pr.setSelectedOption(req.getSelectedOption());
        pr.setTimeOfSubmission(Instant.now());

        pollResultRepository.save(pr);
    }

    // -------------------------------------------------------------------------
    // GET RESULTS
    // -------------------------------------------------------------------------
    @Override
    @Transactional
    public PollResultDTO getPollResults(Integer signalId) {

        Signal s = signalRepository.findById(signalId)
                .orElseThrow(() -> new NotFoundException("Signal not found"));

        ensureDefaultsForExpired(signalId);

        Poll p = pollRepository.findById(signalId)
                .orElseThrow(() -> new NotFoundException("Poll not found"));

        List<PollResult> results = pollResultRepository.findBySignalId(signalId);

        Map<String, Integer> counts = new LinkedHashMap<>();
        Map<String, List<String>> optionToUsers = new LinkedHashMap<>();

        for (String opt : p.getOptions()) {
            counts.put(opt, 0);
            optionToUsers.put(opt, new ArrayList<>());
        }

        for (PollResult r : results) {
            counts.computeIfPresent(r.getSelectedOption(), (k, v) -> v + 1);
            optionToUsers.get(r.getSelectedOption()).add(r.getUserId());
        }

        return new PollResultDTO(
                signalId,
                s.getSharedWith().length,
                results.size(),
                counts,
                Boolean.TRUE.equals(s.getAnonymous()) ? null :
                        optionToUsers.entrySet().stream()
                                .collect(Collectors.toMap(Map.Entry::getKey,
                                        e -> e.getValue().toArray(new String[0])))
        );
    }

    // -------------------------------------------------------------------------
    // EDIT & REPUBLISH
    // -------------------------------------------------------------------------
    @Override
    @Transactional
    public void editSignal(Integer signalId, boolean republish, PollCreateDTO dto) {

        dto.normalizeCommon();
        dto.normalizePoll();
        dto.validateCommon();
        dto.validatePoll();

        Signal s = signalRepository.findById(signalId)
                .orElseThrow(() -> new NotFoundException("Signal not found"));
        Poll poll = pollRepository.findById(signalId)
                .orElseThrow(() -> new NotFoundException("Poll not found"));

        // ---- Duplicate Check ----
        String incomingQ = NormalizationUtils.normalizeQuestion(dto.getQuestion());
        List<String> incomingOpts = NormalizationUtils.normalizeForComparison(dto.getOptions());

        for (Poll p : pollRepository.findAll()) {
            if (p.getSignalId().equals(signalId)) continue;

            if (NormalizationUtils.normalizeQuestion(p.getQuestion()).equals(incomingQ)) {
                if (NormalizationUtils.normalizeForComparison(p.getOptions()).equals(incomingOpts)) {
                    throw new ConflictException("A poll with the same question and options already exists.");
                }
            }
        }

        // ---- Apply updates ----
        poll.setQuestion(dto.getQuestion().trim());
        poll.setOptions(dto.getOptions());

        s.setAnonymous(dto.getAnonymous());
        s.setDefaultFlag(dto.getDefaultFlag());
        s.setDefaultOption(dto.getDefaultOption());
        s.setEndTimestamp(dto.parseEndTimestamp());
        s.setSharedWith(dto.getSharedWith());
        s.setLastEdited(Instant.now());

        pollRepository.save(poll);
        signalRepository.save(s);

        // ---- Republish → delete old responses ----
        if (republish) {
            List<PollResult> existing = pollResultRepository.findBySignalId(signalId);
            if (!existing.isEmpty()) pollResultRepository.deleteAll(existing);
        }
    }

    // -------------------------------------------------------------------------
    // DELETE SIGNAL
    // -------------------------------------------------------------------------
    @Override
    @Transactional
    public void deleteSignal(Integer signalId) {
        if (!signalRepository.existsById(signalId)) {
            throw new NotFoundException("Signal not found");
        }
        signalRepository.deleteById(signalId);
    }
}
