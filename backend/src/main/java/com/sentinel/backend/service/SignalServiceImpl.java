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
import com.sentinel.backend.entity.ScheduledPoll;
import com.sentinel.backend.entity.Signal;
import com.sentinel.backend.exception.CustomException;
import com.sentinel.backend.repository.PollRepository;
import com.sentinel.backend.repository.PollResultRepository;
import com.sentinel.backend.repository.ScheduledPollRepository;
import com.sentinel.backend.repository.SignalRepository;
import com.sentinel.backend.sse.PollSsePublisher;
import com.sentinel.backend.sse.dto.PollSsePayload;
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
import static com.sentinel.backend.constant.Constants.POLL_CREATED;
import static com.sentinel.backend.constant.Constants.POLL_DELETED;
import static com.sentinel.backend.constant.Constants.POLL_EDITED;
import static com.sentinel.backend.constant.Constants.STATUS_DELETED;
import static com.sentinel.backend.constant.Queries.GET_ROLE_BY_EMAIL_AND_PASSWORD;
import static org.springframework.util.StringUtils.hasText;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class SignalServiceImpl implements SignalService {

    private final SignalRepository signalRepository;
    private final PollRepository pollRepository;
    private final PollResultRepository pollResultRepository;
    private final JdbcTemplate jdbcTemplate;
    private final PollSsePublisher pollSsePublisher;
    private final ScheduledPollRepository scheduledPollRepository;
    private final PollSchedulerService pollSchedulerService;

    @Override
    public CreatePollResponse createPoll(PollCreateDTO dto) {

        dto.normalizeCommon();
        dto.normalizePoll();
        dto.validateCommon();
        dto.validatePoll();

        if (dto.isScheduled()) {
            return createScheduledPoll(dto);
        }

        Signal signal = buildSignal(dto);
        signalRepository.save(signal);

        Poll poll = new Poll();
        poll.setSignal(signal);
        poll.setQuestion(dto.getQuestion());
        poll.setOptions(dto.getOptions());
        pollRepository.save(poll);

        publish(signal, poll, POLL_CREATED, false);

        return new CreatePollResponse(signal.getId(), dto.getLocalId());
    }

    @Override
    public void submitOrUpdateVote(PollSubmitDTO dto) {

        dto.normalize();

        Signal signal = getActivePollSignal(dto.getSignalId(), dto.getUserEmail());

        PollResultId id = new PollResultId(signal.getId(), dto.getUserEmail());

        PollResult result = pollResultRepository.findById(id)
                .orElseGet(() -> {
                    PollResult r = new PollResult();
                    r.setId(id);
                    r.setSignal(signal);
                    return r;
                });

        result.setSelectedOption(dto.getSelectedOption());
        result.setDefaultResponse(dto.getDefaultResponse());
        result.setReason(dto.getReason());

        pollResultRepository.save(result);

    }

    @Override
    @Transactional(readOnly = true)
    public PollResultDTO getPollResults(Long signalId) {

        Signal signal = getPollSignal(signalId);
        Poll poll = getPoll(signalId);

        List<PollResult> results =
                pollResultRepository.findByIdSignalId(signalId);

        PollResultDTO dto = buildPollResults(signal, poll, results);

        return dto;
    }

    @Override
    public void editSignal(PollEditDTO dto) {

        dto.normalizeCommon();
        dto.normalizePoll();
        dto.validateCommon();
        dto.validatePoll();

        if (dto.isScheduled()) {
            editScheduledPoll(dto);
            return;
        }

        Signal signal = getEditablePollSignal(dto.getSignalId());
        Poll poll = getPoll(dto.getSignalId());

        handleRepublishOrUnshare(dto, signal);

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
        signal.setLabels(dto.getLabels());

        pollRepository.save(poll);
        signalRepository.save(signal);

        publish(signal, poll, POLL_EDITED, dto.getRepublish());
    }

    @Override
    public void deleteSignal(Long signalId) {

        if (scheduledPollRepository.existsById(signalId)) {
            deleteScheduledPoll(signalId);
            return;
        }

        Signal signal = getPollSignal(signalId);

        pollResultRepository.deleteBySignalId(signalId);
        pollRepository.deleteBySignalId(signalId);
        signalRepository.updateSignalStatus(signalId, STATUS_DELETED);

        pollSsePublisher.publish(
                signal.getSharedWith(),
                POLL_DELETED,
                signalId
        );
    }

    @Override
    public String login(String userEmail, String password) {

        try {
            return jdbcTemplate.queryForObject(
                    GET_ROLE_BY_EMAIL_AND_PASSWORD,
                    String.class,
                    userEmail,
                    password
            );
        } catch (EmptyResultDataAccessException ex) {
            return null;
        }
    }

    private Signal buildSignal(PollCreateDTO dto) {

        Signal s = new Signal();
        s.setCreatedBy(dto.getCreatedBy());
        s.setAnonymous(dto.getAnonymous());
        s.setTypeOfSignal(POLL);
        s.setSharedWith(dto.getSharedWith());
        s.setDefaultFlag(dto.getDefaultFlag());
        s.setDefaultOption(dto.getDefaultOption());
        s.setEndTimestamp(dto.getEndTimestampUtc());
        s.setStatus(ACTIVE);
        s.setPersistentAlert(dto.getPersistentAlert());
        s.setLabels(dto.getLabels());
        return s;
    }

    private Poll getPoll(Long signalId) {
        return pollRepository.findById(signalId)
                .orElseThrow(() -> new CustomException("Poll not found", HttpStatus.NOT_FOUND));
    }

    private Signal getPollSignal(Long signalId) {

        Signal s = signalRepository.findById(signalId)
                .orElseThrow(() -> new CustomException("Signal not found", HttpStatus.NOT_FOUND));

        if (!POLL.equalsIgnoreCase(s.getTypeOfSignal())) {
            throw new CustomException("Not a poll", HttpStatus.BAD_REQUEST);
        }
        return s;
    }

    private Signal getActivePollSignal(Long signalId, String userEmail) {

        Signal s = getPollSignal(signalId);

        if (!ACTIVE.equals(s.getStatus())) {
            throw new CustomException("Poll closed", HttpStatus.BAD_REQUEST);
        }
        if (!Arrays.asList(s.getSharedWith()).contains(userEmail)) {
            throw new CustomException("User not assigned", HttpStatus.BAD_REQUEST);
        }
        return s;
    }

    private Signal getEditablePollSignal(Long signalId) {

        Signal s = getPollSignal(signalId);

        if (!ACTIVE.equals(s.getStatus())) {
            throw new CustomException("Poll completed", HttpStatus.BAD_REQUEST);
        }
        return s;
    }

    private void handleRepublishOrUnshare(PollEditDTO dto, Signal signal) {

        if (Boolean.TRUE.equals(dto.getRepublish())) {
            pollResultRepository.deleteByIdSignalId(dto.getSignalId());
            return;
        }

        Set<String> removedUsers = new HashSet<>(Arrays.asList(signal.getSharedWith()));
        removedUsers.removeAll(Arrays.asList(dto.getSharedWith()));

        if (!removedUsers.isEmpty()) {
            pollResultRepository.deleteBySignalIdAndUserEmails(
                    dto.getSignalId(), removedUsers
            );
        }
    }

    private void publish(
            Signal signal,
            Poll poll,
            String event,
            boolean republish
    ) {
        PollSsePayload payload = buildPollSsePayload(signal, poll);
        payload.setRepublish(republish);

        pollSsePublisher.publish(
                signal.getSharedWith(),
                event,
                payload
        );
    }

    private PollResultDTO buildPollResults(
            Signal signal,
            Poll poll,
            List<PollResult> results
    ) {

        Set<String> activeOptions =
                new LinkedHashSet<>(Arrays.asList(poll.getOptions()));

        Map<String, Integer> optionCounts = new LinkedHashMap<>();
        Map<String, List<UserVoteDTO>> optionVotes = new LinkedHashMap<>();
        Map<String, List<UserVoteDTO>> removedOptions = new LinkedHashMap<>();
        List<UserVoteDTO> defaultResponses = new ArrayList<>();
        Map<String, String> reasonResponses = new LinkedHashMap<>();

        activeOptions.forEach(opt -> {
            optionCounts.put(opt, 0);
            optionVotes.put(opt, new ArrayList<>());
        });

        for (PollResult r : results) {

            UserVoteDTO vote = new UserVoteDTO(
                    r.getId().getUserEmail(),
                    resolveResponseText(r),
                    r.getTimeOfSubmission()
            );

            if (r.getSelectedOption() != null) {
                if (!activeOptions.contains(r.getSelectedOption())) {
                    removedOptions
                            .computeIfAbsent(r.getSelectedOption(), k -> new ArrayList<>())
                            .add(vote);
                } else {
                    optionCounts.compute(r.getSelectedOption(), (k, v) -> v + 1);
                    optionVotes.get(r.getSelectedOption()).add(vote);
                }
            } else if (hasText(r.getReason())) {
                reasonResponses.put(r.getId().getUserEmail(), r.getReason());
            } else {
                defaultResponses.add(vote);
            }
        }

        PollResultDTO dto = new PollResultDTO();
        dto.setSignalId(signal.getId());
        dto.setTotalAssigned(signal.getSharedWith().length);
        dto.setTotalResponded(
                optionVotes.values().stream().mapToInt(List::size).sum()
                        + defaultResponses.size()
                        + reasonResponses.size()
        );
        dto.setOptionCounts(optionCounts);
        dto.setDefaultCount(defaultResponses.size());
        dto.setReasonCount(reasonResponses.size());

        if (Boolean.TRUE.equals(signal.getAnonymous())) {
            return dto;
        }

        dto.setOptionVotes(optionVotes.entrySet().stream()
                .collect(Collectors.toMap(
                        Map.Entry::getKey,
                        e -> e.getValue().toArray(new UserVoteDTO[0])
                )));

        dto.setRemovedOptions(
                removedOptions.isEmpty() ? null :
                        removedOptions.entrySet().stream()
                                .collect(Collectors.toMap(
                                        Map.Entry::getKey,
                                        e -> e.getValue().toArray(new UserVoteDTO[0])
                                ))
        );

        dto.setDefaultResponses(
                defaultResponses.isEmpty() ? null :
                        defaultResponses.toArray(new UserVoteDTO[0])
        );

        dto.setReasonResponses(
                reasonResponses.isEmpty() ? null : reasonResponses
        );

        return dto;
    }

    private String resolveResponseText(PollResult r) {
        if (r.getSelectedOption() != null) return r.getSelectedOption();
        if (r.getDefaultResponse() != null) return r.getDefaultResponse();
        return r.getReason();
    }

    private PollSsePayload buildPollSsePayload(Signal signal, Poll poll) {
        return PollSsePayload.builder()
                .signalId(signal.getId())
                .question(poll.getQuestion())
                .options(poll.getOptions())
                .endTimestamp(signal.getEndTimestamp())
                .anonymous(signal.getAnonymous())
                .defaultFlag(signal.getDefaultFlag())
                .defaultOption(signal.getDefaultOption())
                .persistentAlert(signal.getPersistentAlert())
                .createdBy(signal.getCreatedBy())
                .sharedWith(signal.getSharedWith())
                .labels(signal.getLabels())
                .build();
    }

    private CreatePollResponse createScheduledPoll(PollCreateDTO dto) {
        ScheduledPoll scheduledPoll = buildScheduledPoll(dto);
        scheduledPollRepository.save(scheduledPoll);

        pollSchedulerService.scheduleTask(scheduledPoll);

        log.info("Created scheduled poll id: {} for time: {}",
                scheduledPoll.getId(), scheduledPoll.getScheduledTime());

        return new CreatePollResponse(scheduledPoll.getId(), dto.getLocalId());
    }

    private void editScheduledPoll(PollEditDTO dto) {
        ScheduledPoll scheduledPoll = scheduledPollRepository
                .findById(dto.getSignalId())
                .orElseThrow(() -> new CustomException(
                        "Scheduled poll not found",
                        HttpStatus.NOT_FOUND
                ));

        Instant oldScheduledTime = scheduledPoll.getScheduledTime();

        scheduledPoll.setQuestion(dto.getQuestion());
        scheduledPoll.setOptions(dto.getOptions());
        scheduledPoll.setAnonymous(dto.getAnonymous());
        scheduledPoll.setSharedWith(dto.getSharedWith());
        scheduledPoll.setDefaultFlag(dto.getDefaultFlag());
        scheduledPoll.setDefaultOption(dto.getDefaultOption());
        scheduledPoll.setScheduledTime(dto.getScheduledTime());
        scheduledPoll.setEndTimestamp(dto.getEndTimestampUtc());
        scheduledPoll.setPersistentAlert(dto.getPersistentAlert());
        scheduledPoll.setLabels(dto.getLabels());

        scheduledPollRepository.save(scheduledPoll);

        if (!oldScheduledTime.equals(dto.getScheduledTime())) {
            pollSchedulerService.rescheduleTask(scheduledPoll);
        }

        log.info("Updated scheduled poll id: {}", scheduledPoll.getId());
    }

    private void deleteScheduledPoll(Long scheduledPollId) {
        scheduledPollRepository
                .findById(scheduledPollId)
                .orElseThrow(() -> new CustomException(
                        "Scheduled poll not found",
                        HttpStatus.NOT_FOUND
                ));

        pollSchedulerService.cancelTask(scheduledPollId);
        scheduledPollRepository.deleteById(scheduledPollId);

        log.info("Deleted scheduled poll id: {}", scheduledPollId);
    }

    private ScheduledPoll buildScheduledPoll(PollCreateDTO dto) {

        ScheduledPoll sp = new ScheduledPoll();
        sp.setQuestion(dto.getQuestion());
        sp.setOptions(dto.getOptions());
        sp.setCreatedBy(dto.getCreatedBy());
        sp.setAnonymous(dto.getAnonymous());
        sp.setSharedWith(dto.getSharedWith());
        sp.setDefaultFlag(dto.getDefaultFlag());
        sp.setDefaultOption(dto.getDefaultOption());
        sp.setScheduledTime(dto.getScheduledTime());
        sp.setEndTimestamp(dto.getEndTimestampUtc());
        sp.setPersistentAlert(dto.getPersistentAlert());
        sp.setLabels(dto.getLabels());
        return sp;
    }
}
