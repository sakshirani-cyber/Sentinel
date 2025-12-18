package com.sentinel.backend.service;

import com.sentinel.backend.dto.response.CreatePollResponse;
import com.sentinel.backend.dto.request.PollCreateDTO;
import com.sentinel.backend.dto.response.PollResultDTO;
import com.sentinel.backend.dto.request.SubmitPollRequest;
import com.sentinel.backend.dto.helper.UserVoteDTO;
import com.sentinel.backend.entity.Poll;
import com.sentinel.backend.entity.PollResult;
import com.sentinel.backend.entity.PollResultId;
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
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

import static com.sentinel.backend.constant.Constants.ACTIVE;
import static com.sentinel.backend.constant.Constants.COMPLETED;
import static com.sentinel.backend.constant.Constants.POLL;
import static org.springframework.util.StringUtils.hasText;


@Service
@RequiredArgsConstructor
@Slf4j
public class SignalServiceImpl implements SignalService {

    private final SignalRepository signalRepository;
    private final PollRepository pollRepository;
    private final PollResultRepository pollResultRepository;
    private final JdbcTemplate jdbcTemplate;

    @Override
    @Transactional
    public CreatePollResponse createPoll(PollCreateDTO dto) {

        dto.normalizeCommon();
        dto.normalizePoll();
        dto.validateCommon();
        dto.validatePoll();

        if (!POLL.equalsIgnoreCase(dto.getType())) {
            throw new CustomException("Invalid signal type for poll creation", HttpStatus.BAD_REQUEST);
        }

        if (Boolean.TRUE.equals(dto.getDefaultFlag())&& !hasText(dto.getDefaultOption())) {
            throw new CustomException(
                    "defaultOption is required when defaultFlag is true",
                    HttpStatus.BAD_REQUEST
            );
        }

        String normalizedQuestion =
                NormalizationUtils.normalizeQuestion(dto.getQuestion());

        List<String> normalizedOptions =
                NormalizationUtils.normalizeForComparison(dto.getOptions());

        List<Poll> activePolls =
                pollRepository.findActivePollsByQuestion(normalizedQuestion);

        for (Poll p : activePolls) {
            List<String> existingOpts =
                    NormalizationUtils.normalizeForComparison(p.getOptions());

            if (normalizedOptions.equals(existingOpts)) {
                throw new CustomException(
                        "A similar poll is already active. Signal ID: " +
                                p.getSignal().getId(),
                        HttpStatus.CONFLICT
                );
            }
        }

        Signal signal = new Signal();
        signal.setCreatedBy(dto.getCreatedBy());
        signal.setAnonymous(dto.getAnonymous());
        signal.setTypeOfSignal(POLL);
        signal.setSharedWith(dto.getSharedWith());
        signal.setDefaultFlag(Boolean.TRUE.equals(dto.getDefaultFlag()));
        signal.setDefaultOption(dto.getDefaultOption());
        signal.setEndTimestamp(dto.getEndTimestampUtc());
        signal.setStatus(ACTIVE);

        Signal savedSignal = signalRepository.save(signal);

        Poll poll = new Poll();
        poll.setSignal(savedSignal);
        poll.setQuestion(dto.getQuestion());
        poll.setOptions(dto.getOptions());

        pollRepository.save(poll);

        return new CreatePollResponse(savedSignal.getId(), dto.getLocalId());
    }

    protected void ensureDefaultsForExpired(Signal signal) {

        if (!ACTIVE.equals(signal.getStatus())) return;
        if (signal.getEndTimestamp() == null) return;

        Instant now = Instant.now();
        if (now.isBefore(signal.getEndTimestamp())) return;

        if (!hasText(signal.getDefaultOption())) {
            throw new CustomException(
                    "defaultOption must be configured to auto-submit defaults",
                    HttpStatus.INTERNAL_SERVER_ERROR
            );
        }

        Set<String> respondedUsers =
                pollResultRepository.findByIdSignalId(signal.getId())
                        .stream()
                        .map(r -> r.getId().getUserId())
                        .collect(Collectors.toSet());

        List<PollResult> toInsert = new ArrayList<>();

        for (String uid : signal.getSharedWith()) {
            if (!respondedUsers.contains(uid)) {

                PollResultId id = new PollResultId();
                id.setSignalId(signal.getId());
                id.setUserId(uid);

                PollResult pr = new PollResult();
                pr.setId(id);
                pr.setSignal(signal);
                pr.setSelectedOption(null);
                pr.setDefaultResponse(signal.getDefaultOption());
                pr.setReason(null);
                pr.setTimeOfSubmission(signal.getEndTimestamp());

                toInsert.add(pr);
            }
        }

        if (!toInsert.isEmpty()) {
            pollResultRepository.saveAll(toInsert);
        }

        signal.setStatus(COMPLETED);
        signalRepository.save(signal);
    }

    @Override
    @Transactional
    public void submitOrUpdateVote(SubmitPollRequest req) {

        req.normalize();

        Signal signal = signalRepository.findById(req.getSignalId())
                .orElseThrow(() -> new CustomException("Signal not found", HttpStatus.NOT_FOUND));

        if (!POLL.equalsIgnoreCase(signal.getTypeOfSignal())) {
            throw new CustomException("Signal is not a poll", HttpStatus.BAD_REQUEST);
        }

        ensureDefaultsForExpired(signal);

        if (!ACTIVE.equals(signal.getStatus())) {
            throw new CustomException("Poll is closed for submissions", HttpStatus.BAD_REQUEST);
        }

        if (!Arrays.asList(signal.getSharedWith()).contains(req.getUserId())) {
            throw new CustomException("User is not assigned to this poll", HttpStatus.BAD_REQUEST);
        }

        boolean hasOption = hasText(req.getSelectedOption());
        boolean hasDefault = hasText(req.getDefaultResponse());
        boolean hasReason = hasText(req.getReason());

        int provided = (hasOption ? 1 : 0) + (hasDefault ? 1 : 0) + (hasReason ? 1 : 0);

        if (provided != 1) {
            throw new CustomException(
                    "Exactly one of selectedOption, defaultResponse, or reason must be provided",
                    HttpStatus.BAD_REQUEST
            );
        }

        Poll poll = pollRepository.findById(req.getSignalId())
                .orElseThrow(() -> new CustomException("Poll not found", HttpStatus.NOT_FOUND));

        if (hasOption &&
                Arrays.stream(poll.getOptions()).noneMatch(req.getSelectedOption()::equals)) {
            throw new CustomException("Selected option is invalid", HttpStatus.BAD_REQUEST);
        }

        PollResultId id = new PollResultId();
        id.setSignalId(signal.getId());
        id.setUserId(req.getUserId());

        PollResult pr = pollResultRepository.findById(id)
                .orElseGet(() -> {
                    PollResult x = new PollResult();
                    x.setId(id);
                    x.setSignal(signal);
                    return x;
                });

        pr.setTimeOfSubmission(Instant.now());
        pr.setSelectedOption(hasOption ? req.getSelectedOption() : null);
        pr.setDefaultResponse(hasDefault ? req.getDefaultResponse() : null);
        pr.setReason(hasReason ? req.getReason() : null);

        pollResultRepository.save(pr);
    }

    @Override
    @Transactional
    public PollResultDTO getPollResults(Integer signalId) {

        Signal signal = signalRepository.findById(signalId)
                .orElseThrow(() -> new CustomException("Signal not found", HttpStatus.NOT_FOUND));

        if (!POLL.equalsIgnoreCase(signal.getTypeOfSignal())) {
            throw new CustomException("Signal is not a poll", HttpStatus.BAD_REQUEST);
        }

        ensureDefaultsForExpired(signal);

        Poll poll = pollRepository.findById(signalId)
                .orElseThrow(() -> new CustomException("Poll not found", HttpStatus.NOT_FOUND));

        List<PollResult> results =
                pollResultRepository.findByIdSignalId(signalId);

        Set<String> activeOptions =
                new LinkedHashSet<>(Arrays.asList(poll.getOptions()));

        Set<String> activeUsers =
                new HashSet<>(Arrays.asList(signal.getSharedWith()));

        Map<String, Integer> optionCounts = new LinkedHashMap<>();
        Map<String, List<UserVoteDTO>> optionVotes = new LinkedHashMap<>();
        Map<String, List<UserVoteDTO>> archivedOptions = new LinkedHashMap<>();
        List<UserVoteDTO> removedUsers = new ArrayList<>();
        List<UserVoteDTO> defaultResponses = new ArrayList<>();
        Map<String, String> reasonResponses = new LinkedHashMap<>();

        for (String opt : activeOptions) {
            optionCounts.put(opt, 0);
            optionVotes.put(opt, new ArrayList<>());
        }

        for (PollResult r : results) {

            String userId = r.getId().getUserId();
            UserVoteDTO vote = new UserVoteDTO(
                    userId,
                    resolveResponseText(r),
                    r.getTimeOfSubmission()
            );

            if (!activeUsers.contains(userId)) {
                removedUsers.add(vote);
                continue;
            }

            if (r.getSelectedOption() != null) {
                String opt = r.getSelectedOption();
                if (!activeOptions.contains(opt)) {
                    archivedOptions.computeIfAbsent(opt, k -> new ArrayList<>()).add(vote);
                } else {
                    optionCounts.put(opt, optionCounts.get(opt) + 1);
                    optionVotes.get(opt).add(vote);
                }
                continue;
            }

            if (hasText(r.getReason())) {
                reasonResponses.put(userId, r.getReason());
            } else {
                defaultResponses.add(vote);
            }
        }

        int defaultCount = defaultResponses.size();
        int reasonCount = reasonResponses.size();

        int totalResponded =
                optionVotes.values().stream().mapToInt(List::size).sum()
                        + defaultCount
                        + reasonCount;

        boolean anonymous = Boolean.TRUE.equals(signal.getAnonymous());

        PollResultDTO dto = new PollResultDTO();
        dto.setSignalId(signalId);
        dto.setTotalAssigned(signal.getSharedWith().length);
        dto.setTotalResponded(totalResponded);
        dto.setOptionCounts(optionCounts);
        dto.setDefaultCount(defaultCount);
        dto.setReasonCount(reasonCount);

        if (anonymous) {
            dto.setOptionVotes(null);
            dto.setRemovedOptions(null);
            dto.setRemovedUsers(null);
            dto.setDefaultResponses(null);
            dto.setReasonResponses(null);
            return dto;
        }

        dto.setOptionVotes(
                optionVotes.entrySet().stream()
                        .collect(Collectors.toMap(
                                Map.Entry::getKey,
                                e -> e.getValue().toArray(new UserVoteDTO[0])
                        ))
        );

        dto.setRemovedOptions(
                archivedOptions.isEmpty() ? null :
                        archivedOptions.entrySet().stream()
                                .collect(Collectors.toMap(
                                        Map.Entry::getKey,
                                        e -> e.getValue().toArray(new UserVoteDTO[0])
                                ))
        );

        dto.setRemovedUsers(
                removedUsers.isEmpty() ? null :
                        Map.of("removed", removedUsers.toArray(new UserVoteDTO[0]))
        );

        dto.setDefaultResponses(
                defaultResponses.isEmpty() ? null :
                        defaultResponses.toArray(new UserVoteDTO[0])
        );

        dto.setReasonResponses(
                reasonResponses.isEmpty() ? null :
                        reasonResponses
        );

        return dto;
    }

    private String resolveResponseText(PollResult r) {
        if (r.getSelectedOption() != null) return r.getSelectedOption();
        if (r.getDefaultResponse() != null) return r.getDefaultResponse();
        return r.getReason();
    }

    @Override
    @Transactional
    public void editSignal(Integer signalId, boolean republish, PollCreateDTO dto) {

        dto.normalizeCommon();
        dto.normalizePoll();
        dto.validateCommon();
        dto.validatePoll();

        Signal signal = signalRepository.findById(signalId)
                .orElseThrow(() ->
                        new CustomException("Signal not found", HttpStatus.NOT_FOUND));

        if (!POLL.equalsIgnoreCase(signal.getTypeOfSignal())) {
            throw new CustomException("Signal is not a poll", HttpStatus.BAD_REQUEST);
        }

        if (!ACTIVE.equals(signal.getStatus())) {
            throw new CustomException(
                    "Poll is already completed and cannot be edited",
                    HttpStatus.BAD_REQUEST
            );
        }

        Poll poll = pollRepository.findById(signalId)
                .orElseThrow(() ->
                        new CustomException("Poll not found", HttpStatus.NOT_FOUND));

        Instant now = Instant.now();

        String normalizedQ =
                NormalizationUtils.normalizeQuestion(dto.getQuestion());

        List<String> normalizedOpts =
                NormalizationUtils.normalizeForComparison(dto.getOptions());

        List<Poll> activeWithSameQ =
                pollRepository.findActivePollsByQuestion(normalizedQ);

        for (Poll p : activeWithSameQ) {
            if (p.getSignalId().equals(signalId)) continue;

            List<String> opts =
                    NormalizationUtils.normalizeForComparison(p.getOptions());

            if (normalizedOpts.equals(opts)) {
                throw new CustomException(
                        "A similar active poll already exists. Signal ID: "
                                + p.getSignal().getId(),
                        HttpStatus.CONFLICT
                );
            }
        }

        if (Boolean.TRUE.equals(dto.getDefaultFlag())
                && (dto.getDefaultOption() == null || dto.getDefaultOption().isBlank())) {
            throw new CustomException(
                    "defaultOption is required when defaultFlag is true",
                    HttpStatus.BAD_REQUEST
            );
        }

        if (republish) {
            pollResultRepository.deleteByIdSignalId(signalId);
        }

        poll.setQuestion(dto.getQuestion());
        poll.setOptions(dto.getOptions());

        signal.setAnonymous(dto.getAnonymous());
        signal.setDefaultFlag(dto.getDefaultFlag());
        signal.setDefaultOption(dto.getDefaultOption());
        signal.setSharedWith(dto.getSharedWith());
        signal.setLastEdited(now);

        Instant newEnd = dto.getEndTimestampUtc();

        if (!republish && signal.getEndTimestamp().isBefore(newEnd)) {
            signal.setEndTimestamp(newEnd);
        } else if (republish) {
            signal.setEndTimestamp(newEnd);
        }

        pollRepository.save(poll);
        signalRepository.save(signal);
    }

    @Override
    @Transactional
    public void deleteSignal(Integer signalId) {

        Signal signal = signalRepository.findById(signalId)
                .orElseThrow(() ->
                        new CustomException("Signal not found", HttpStatus.NOT_FOUND));

        if (!POLL.equalsIgnoreCase(signal.getTypeOfSignal())) {
            throw new CustomException(
                    "Only poll signals can be deleted using this API",
                    HttpStatus.BAD_REQUEST
            );
        }
        signalRepository.delete(signal);
    }

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
