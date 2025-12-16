package com.sentinel.backend.service;

import com.sentinel.backend.dto.CreatePollResponse;
import com.sentinel.backend.dto.PollCreateDTO;
import com.sentinel.backend.dto.PollResultDTO;
import com.sentinel.backend.dto.SubmitPollRequest;
import com.sentinel.backend.entity.Poll;
import com.sentinel.backend.entity.PollResult;
import com.sentinel.backend.entity.Signal;
import com.sentinel.backend.exception.CustomException;
import com.sentinel.backend.repository.PollRepository;
import com.sentinel.backend.repository.PollResultRepository;
import com.sentinel.backend.repository.SignalRepository;
import com.sentinel.backend.util.NormalizationUtils;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.dao.EmptyResultDataAccessException;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
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
    private final JdbcTemplate jdbcTemplate;

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

        String incomingQ = NormalizationUtils.normalizeQuestion(dto.getQuestion());
        List<String> incomingOpts = NormalizationUtils.normalizeForComparison(dto.getOptions());

        Instant now = Instant.now();

        for (Poll p : pollRepository.findAll()) {

            if (!incomingQ.equals(NormalizationUtils.normalizeQuestion(p.getQuestion())))
                continue;

            if (!incomingOpts.equals(NormalizationUtils.normalizeForComparison(p.getOptions())))
                continue;

            Signal sig = p.getSignal();
            if (sig != null && sig.getEndTimestamp() != null && sig.getEndTimestamp().isAfter(now)) {
                throw new CustomException(
                        "A similar poll is already active. Signal ID: " + sig.getId(),
                        HttpStatus.CONFLICT
                );
            }
        }

        Signal s = new Signal();
        s.setCreatedBy(dto.getCreatedBy());
        s.setAnonymous(dto.getAnonymous());
        s.setEndTimestamp(dto.parseEndTimestamp());
        s.setTypeOfSignal(dto.getType());
        s.setDefaultFlag(Boolean.TRUE.equals(dto.getDefaultFlag()));
        s.setDefaultOption(dto.getDefaultOption());
        s.setSharedWith(dto.getSharedWith());

        Signal saved = signalRepository.save(s);

        Poll poll = new Poll();
        poll.setSignal(saved);
        poll.setQuestion(dto.getQuestion());
        poll.setOptions(dto.getOptions());

        pollRepository.save(poll);

        return new CreatePollResponse(saved.getId(), dto.getLocalId());
    }

    // -------------------------------------------------------------------------
    // AUTO DEFAULT FILL FOR EXPIRED SIGNALS
    // -------------------------------------------------------------------------
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
                .orElseThrow(() -> new CustomException(
                        "Signal not found",
                        HttpStatus.NOT_FOUND
                ));

        if (s.getEndTimestamp() != null && Instant.now().isAfter(s.getEndTimestamp())) {
            ensureDefaultsForExpired(req.getSignalId());
            throw new CustomException("Poll is closed for submissions.", HttpStatus.BAD_REQUEST);
        }

        if (!Arrays.asList(s.getSharedWith()).contains(req.getUserId())) {
            throw new CustomException("User is not assigned to this poll.", HttpStatus.BAD_REQUEST);
        }

        Poll poll = pollRepository.findById(req.getSignalId())
                .orElseThrow(() -> new CustomException(
                        "Poll data not found",
                        HttpStatus.NOT_FOUND
                ));

        boolean valid = Arrays.asList(poll.getOptions())
                .contains(req.getSelectedOption());

        if (!valid) {
            throw new CustomException("Selected option is invalid.", HttpStatus.BAD_REQUEST);
        }

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
                .orElseThrow(() -> new CustomException("Signal not found", HttpStatus.NOT_FOUND));

        ensureDefaultsForExpired(signalId);

        Poll p = pollRepository.findById(signalId)
                .orElseThrow(() -> new CustomException("Poll not found", HttpStatus.NOT_FOUND));

        List<PollResult> results = pollResultRepository.findBySignalId(signalId);

        Map<String, Integer> counts = new LinkedHashMap<>();
        Map<String, List<String>> optionToUsers = new LinkedHashMap<>();

        Map<String, List<String>> archivedOptionToUsers = new LinkedHashMap<>();

        for (String opt : p.getOptions()) {
            counts.put(opt, 0);
            optionToUsers.put(opt, new ArrayList<>());
        }

        for (PollResult r : results) {
            String selected = r.getSelectedOption();
            if (optionToUsers.containsKey(selected)) {
                counts.put(selected, counts.get(selected) + 1);
                optionToUsers.get(selected).add(r.getUserId());
            } else {
                archivedOptionToUsers.computeIfAbsent(selected, k -> new ArrayList<>()).add(r.getUserId());
            }
        }

        PollResultDTO dto = new PollResultDTO();
        dto.setSignalId(signalId);
        dto.setTotalAssigned(s.getSharedWith().length);
        dto.setTotalResponded(results.size());
        dto.setOptionCounts(counts);

        dto.setOptionToUsers(
                Boolean.TRUE.equals(s.getAnonymous())
                        ? null
                        : optionToUsers.entrySet().stream()
                        .collect(Collectors.toMap(
                                Map.Entry::getKey,
                                e -> e.getValue().toArray(new String[0])
                        ))
        );

        dto.setArchivedOptions(
                archivedOptionToUsers.isEmpty()
                        ? null
                        : archivedOptionToUsers.entrySet().stream()
                        .collect(Collectors.toMap(
                                Map.Entry::getKey,
                                e -> e.getValue().toArray(new String[0])
                        ))
        );

        return dto;
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
                .orElseThrow(() -> new CustomException("Signal not found", HttpStatus.NOT_FOUND));
        Poll poll = pollRepository.findById(signalId)
                .orElseThrow(() -> new CustomException("Poll not found", HttpStatus.NOT_FOUND));

        String incomingQ = NormalizationUtils.normalizeQuestion(dto.getQuestion());
        List<String> incomingOpts = NormalizationUtils.normalizeForComparison(dto.getOptions());

        for (Poll p : pollRepository.findAll()) {
            if (p.getSignalId().equals(signalId)) continue;

            if (NormalizationUtils.normalizeQuestion(p.getQuestion()).equals(incomingQ)) {
                if (NormalizationUtils.normalizeForComparison(p.getOptions()).equals(incomingOpts)) {
                    throw new CustomException(
                            "A poll with the same question and options already exists.",
                            HttpStatus.CONFLICT
                    );
                }
            }
        }

        poll.setQuestion(dto.getQuestion());
        poll.setOptions(dto.getOptions());

        s.setAnonymous(dto.getAnonymous());
        s.setDefaultFlag(dto.getDefaultFlag());
        s.setDefaultOption(dto.getDefaultOption());
        s.setEndTimestamp(dto.parseEndTimestamp());
        s.setSharedWith(dto.getSharedWith());
        s.setLastEdited(Instant.now());

        pollRepository.save(poll);
        signalRepository.save(s);

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
            throw new CustomException("Signal not found", HttpStatus.NOT_FOUND);
        }
        signalRepository.deleteById(signalId);
    }

    // -------------------------------------------------------------------------
    // LOGIN
    // -------------------------------------------------------------------------
    @Override
    public String login(String email, String password) {
        String sql = """
        SELECT role
        FROM users
        WHERE email = ?
          AND password = ?
        """;

        try {
            return jdbcTemplate.queryForObject(
                    sql,
                    String.class,
                    email,
                    password
            );
        } catch (EmptyResultDataAccessException e) {
            return null;
        }
    }
}
