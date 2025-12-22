package com.sentinel.backend.service;

import com.sentinel.backend.dto.request.PollEditDTO;
import com.sentinel.backend.dto.request.PollCreateDTO;
import com.sentinel.backend.dto.request.PollSubmitDTO;
import com.sentinel.backend.dto.response.CreatePollResponse;
import com.sentinel.backend.dto.response.PollResultDTO;
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
import static com.sentinel.backend.constant.Constants.POLL;
import static com.sentinel.backend.constant.Constants.REMOVED;
import static com.sentinel.backend.constant.Queries.GET_ROLE_BY_EMAIL_AND_PASSWORD;
import static org.springframework.util.StringUtils.hasText;

@Service
@RequiredArgsConstructor
@Slf4j
public class SignalServiceImpl implements SignalService {

    private final SignalRepository signalRepository;
    private final PollRepository pollRepository;
    private final PollResultRepository pollResultRepository;
    private final JdbcTemplate jdbcTemplate;
    private final ActivePollService activePollService;

    @Override
    @Transactional
    public CreatePollResponse createPoll(PollCreateDTO dto) {

        normalizeAndValidateCreate(dto);
        validateDuplicateActivePoll(dto);

        Signal signal = buildSignal(dto);
        Signal savedSignal = signalRepository.save(signal);

        Poll poll = new Poll();
        poll.setSignal(savedSignal);
        poll.setQuestion(dto.getQuestion());
        poll.setOptions(dto.getOptions());
        pollRepository.save(poll);

        evictActivePollCache(dto.getSharedWith());

        return new CreatePollResponse(savedSignal.getId(), dto.getLocalId());
    }

    @Override
    @Transactional
    public void submitOrUpdateVote(PollSubmitDTO req) {

        req.normalize();

        Signal signal = getValidActivePollSignal(req.getSignalId(), req.getUserId());
        Poll poll = getPoll(req.getSignalId());

        PollResult pr = buildOrUpdatePollResult(req, signal, poll);
        pollResultRepository.save(pr);

        activePollService.evictUserCache(req.getUserId());
    }

    @Override
    @Transactional
    public PollResultDTO getPollResults(Integer signalId) {
        return buildPollResults(signalId);
    }

    @Override
    @Transactional
    public void editSignal(PollEditDTO dto) {

        normalizeAndValidateEdit(dto);

        Signal signal = getEditablePollSignal(dto.getSignalId());
        Poll poll = getPoll(dto.getSignalId());

        if (dto.getRepublish()) {
            pollResultRepository.deleteByIdSignalId(dto.getSignalId());
        }

        poll.setQuestion(dto.getQuestion());
        poll.setOptions(dto.getOptions());

        signal.setAnonymous(dto.getAnonymous());
        signal.setDefaultFlag(dto.getDefaultFlag());
        signal.setDefaultOption(dto.getDefaultOption());
        signal.setSharedWith(dto.getSharedWith());
        signal.setLastEditedBy(dto.getLastEditedBy());
        signal.setLastEdited(Instant.now());
        signal.setEndTimestamp(dto.getEndTimestampUtc());
        signal.setPersistentAlert(dto.getPersistentAlert());

        pollRepository.save(poll);
        signalRepository.save(signal);

        evictActivePollCache(signal.getSharedWith());
    }

    @Override
    @Transactional
    public void deleteSignal(Integer signalId) {

        Signal signal = signalRepository.findById(signalId)
                .orElseThrow(() -> new CustomException("Signal not found", HttpStatus.NOT_FOUND));

        if (!POLL.equalsIgnoreCase(signal.getTypeOfSignal())) {
            throw new CustomException("Only poll signals can be deleted", HttpStatus.BAD_REQUEST);
        }

        signalRepository.delete(signal);
        evictActivePollCache(signal.getSharedWith());
    }

    @Override
    public String login(String email, String password) {
        try {
            return jdbcTemplate.queryForObject(
                    GET_ROLE_BY_EMAIL_AND_PASSWORD,
                    String.class,
                    email,
                    password
            );
        } catch (EmptyResultDataAccessException e) {
            return null;
        }
    }

    private Poll getPoll(Integer signalId) {
        return pollRepository.findById(signalId)
                .orElseThrow(() -> new CustomException("Poll not found", HttpStatus.NOT_FOUND));
    }

    private void evictActivePollCache(String[] users) {
        if (users == null) return;
        for (String u : users) {
            activePollService.evictUserCache(u);
        }
    }

    private void normalizeAndValidateCreate(PollCreateDTO dto) {
        dto.normalizeCommon();
        dto.normalizePoll();
        dto.validateCommon();
        dto.validatePoll();

        if (!POLL.equalsIgnoreCase(dto.getType())) {
            throw new CustomException("Invalid signal type", HttpStatus.BAD_REQUEST);
        }

        if (Boolean.TRUE.equals(dto.getDefaultFlag()) && !hasText(dto.getDefaultOption())) {
            throw new CustomException("Default Option required", HttpStatus.BAD_REQUEST);
        }
    }

    private Signal buildSignal(PollCreateDTO dto) {
        Signal s = new Signal();
        s.setCreatedBy(dto.getCreatedBy());
        s.setAnonymous(dto.getAnonymous());
        s.setTypeOfSignal(POLL);
        s.setSharedWith(dto.getSharedWith());
        s.setDefaultFlag(Boolean.TRUE.equals(dto.getDefaultFlag()));
        s.setDefaultOption(dto.getDefaultOption());
        s.setEndTimestamp(dto.getEndTimestampUtc());
        s.setStatus(ACTIVE);
        s.setPersistentAlert(Boolean.TRUE.equals(dto.getPersistentAlert()));
        return s;
    }

    private void validateDuplicateActivePoll(PollCreateDTO dto) {
        String q = NormalizationUtils.normalizeQuestion(dto.getQuestion());
        List<String> opts = NormalizationUtils.normalizeForComparison(dto.getOptions());

        for (Poll p : pollRepository.findActivePollsByQuestion(q)) {
            if (opts.equals(NormalizationUtils.normalizeForComparison(p.getOptions()))) {
                throw new CustomException("Similar active poll exists", HttpStatus.CONFLICT);
            }
        }
    }

    protected void ensureDefaultsForExpired(Signal signal) {

        if (signal.getEndTimestamp() == null) return;
        if (Instant.now().isBefore(signal.getEndTimestamp())) return;

        if (!hasText(signal.getDefaultOption())) {
            throw new CustomException("Default Option required", HttpStatus.INTERNAL_SERVER_ERROR);
        }

        Set<String> responded =
                pollResultRepository.findByIdSignalId(signal.getId())
                        .stream().map(r -> r.getId().getUserId()).collect(Collectors.toSet());

        List<PollResult> inserts = new ArrayList<>();

        for (String userId : signal.getSharedWith()) {
            if (!responded.contains(userId)) {

                PollResultId id = new PollResultId(signal.getId(), userId);

                PollResult pr = new PollResult();
                pr.setId(id);
                pr.setSignal(signal);
                pr.setSelectedOption(null);
                pr.setDefaultResponse(signal.getDefaultOption());
                pr.setReason(null);
                pr.setTimeOfSubmission(signal.getEndTimestamp());

                inserts.add(pr);
            }
        }

        if (!inserts.isEmpty()) pollResultRepository.saveAll(inserts);

    }

    private Signal getValidActivePollSignal(Integer signalId, String userId) {

        Signal s = signalRepository.findById(signalId)
                .orElseThrow(() -> new CustomException("Signal not found", HttpStatus.NOT_FOUND));

        if (!POLL.equalsIgnoreCase(s.getTypeOfSignal())) {
            throw new CustomException("Not a poll", HttpStatus.BAD_REQUEST);
        }

        ensureDefaultsForExpired(s);

        if (!ACTIVE.equals(s.getStatus())) {
            throw new CustomException("Poll closed", HttpStatus.BAD_REQUEST);
        }

        if (!Arrays.asList(s.getSharedWith()).contains(userId)) {
            throw new CustomException("User not assigned", HttpStatus.BAD_REQUEST);
        }

        return s;
    }

    private PollResult buildOrUpdatePollResult(
            PollSubmitDTO req, Signal signal, Poll poll) {

        boolean opt = hasText(req.getSelectedOption());
        boolean def = hasText(req.getDefaultResponse());
        boolean rea = hasText(req.getReason());

        if ((opt ? 1 : 0) + (def ? 1 : 0) + (rea ? 1 : 0) != 1) {
            throw new CustomException("Exactly one response required", HttpStatus.BAD_REQUEST);
        }

        if (opt && Arrays.stream(poll.getOptions()).noneMatch(req.getSelectedOption()::equals)) {
            throw new CustomException("Invalid option", HttpStatus.BAD_REQUEST);
        }

        PollResultId id = new PollResultId(signal.getId(), req.getUserId());

        PollResult pr = pollResultRepository.findById(id)
                .orElseGet(() -> {
                    PollResult x = new PollResult();
                    x.setId(id);
                    x.setSignal(signal);
                    return x;
                });

        pr.setTimeOfSubmission(Instant.now());
        pr.setSelectedOption(opt ? req.getSelectedOption() : null);
        pr.setDefaultResponse(def ? req.getDefaultResponse() : null);
        pr.setReason(rea ? req.getReason() : null);

        return pr;
    }

    private PollResultDTO buildPollResults(Integer signalId) {

        Signal signal = signalRepository.findById(signalId)
                .orElseThrow(() -> new CustomException("Signal not found", HttpStatus.NOT_FOUND));

        if (!POLL.equalsIgnoreCase(signal.getTypeOfSignal())) {
            throw new CustomException("Not a poll", HttpStatus.BAD_REQUEST);
        }

        ensureDefaultsForExpired(signal);

        Poll poll = getPoll(signalId);
        List<PollResult> results = pollResultRepository.findByIdSignalId(signalId);

        Set<String> activeOptions = new LinkedHashSet<>(Arrays.asList(poll.getOptions()));
        Set<String> activeUsers = new HashSet<>(Arrays.asList(signal.getSharedWith()));

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

            UserVoteDTO vote = new UserVoteDTO(
                    r.getId().getUserId(),
                    resolveResponseText(r),
                    r.getTimeOfSubmission()
            );

            if (!activeUsers.contains(r.getId().getUserId())) {
                removedUsers.add(vote);
                continue;
            }

            if (r.getSelectedOption() != null) {
                if (!activeOptions.contains(r.getSelectedOption())) {
                    archivedOptions.computeIfAbsent(r.getSelectedOption(), k -> new ArrayList<>()).add(vote);
                } else {
                    optionCounts.compute(r.getSelectedOption(), (k, v) -> v + 1);
                    optionVotes.get(r.getSelectedOption()).add(vote);
                }
            } else if (hasText(r.getReason())) {
                reasonResponses.put(r.getId().getUserId(), r.getReason());
            } else {
                defaultResponses.add(vote);
            }
        }

        PollResultDTO dto = new PollResultDTO();
        dto.setSignalId(signalId);
        dto.setTotalAssigned(signal.getSharedWith().length);
        dto.setTotalResponded(
                optionVotes.values().stream().mapToInt(List::size).sum()
                        + defaultResponses.size()
                        + reasonResponses.size()
        );
        dto.setOptionCounts(optionCounts);
        dto.setDefaultCount(defaultResponses.size());
        dto.setReasonCount(reasonResponses.size());

        if (Boolean.TRUE.equals(signal.getAnonymous())) return dto;

        dto.setOptionVotes(optionVotes.entrySet().stream()
                .collect(Collectors.toMap(Map.Entry::getKey,
                        e -> e.getValue().toArray(new UserVoteDTO[0]))));

        dto.setRemovedOptions(archivedOptions.isEmpty() ? null :
                archivedOptions.entrySet().stream()
                        .collect(Collectors.toMap(Map.Entry::getKey,
                                e -> e.getValue().toArray(new UserVoteDTO[0]))));

        dto.setRemovedUsers(removedUsers.isEmpty() ? null :
                Map.of(REMOVED, removedUsers.toArray(new UserVoteDTO[0])));

        dto.setDefaultResponses(defaultResponses.isEmpty() ? null :
                defaultResponses.toArray(new UserVoteDTO[0]));

        dto.setReasonResponses(reasonResponses.isEmpty() ? null : reasonResponses);

        return dto;
    }

    private String resolveResponseText(PollResult r) {
        if (r.getSelectedOption() != null) return r.getSelectedOption();
        if (r.getDefaultResponse() != null) return r.getDefaultResponse();
        return r.getReason();
    }

    private void normalizeAndValidateEdit(PollEditDTO dto) {
        dto.normalizeCommon();
        dto.normalizePoll();
        dto.validateCommon();
        dto.validatePoll();

        if (Boolean.TRUE.equals(dto.getDefaultFlag())
                && !hasText(dto.getDefaultOption())) {
            throw new CustomException("Default Option required", HttpStatus.BAD_REQUEST);
        }
    }

    private Signal getEditablePollSignal(Integer signalId) {
        Signal s = signalRepository.findById(signalId)
                .orElseThrow(() -> new CustomException("Signal not found", HttpStatus.NOT_FOUND));

        if (!POLL.equalsIgnoreCase(s.getTypeOfSignal())) {
            throw new CustomException("Not a poll", HttpStatus.BAD_REQUEST);
        }
        if (!ACTIVE.equals(s.getStatus())) {
            throw new CustomException("Poll completed", HttpStatus.BAD_REQUEST);
        }
        return s;
    }
}
