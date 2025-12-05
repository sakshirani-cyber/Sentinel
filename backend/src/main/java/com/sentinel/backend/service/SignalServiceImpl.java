package com.sentinel.backend.service;

import com.sentinel.backend.dto.CreatePollRequest;
import com.sentinel.backend.dto.PollResultDTO;
import com.sentinel.backend.dto.SubmitPollResponse;
import com.sentinel.backend.dto.UserPollDTO;
import com.sentinel.backend.dto.YourDashboardDTO;
import com.sentinel.backend.entity.Poll;
import com.sentinel.backend.entity.PollAssignment;
import com.sentinel.backend.entity.PollResult;
import com.sentinel.backend.entity.Signal;
import com.sentinel.backend.repository.PollAssignmentRepository;
import com.sentinel.backend.repository.PollRepository;
import com.sentinel.backend.repository.PollResultRepository;
import com.sentinel.backend.repository.SignalRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class SignalServiceImpl implements SignalService {

    private final SignalRepository signalRepository;
    private final PollRepository pollRepository;
    private final PollResultRepository pollResultRepository;
    private final PollAssignmentRepository pollAssignmentRepository;

    @Override
    public Integer createPoll(CreatePollRequest req) {
        log.debug("Creating poll with data: {}", req);

        List<String> incoming = Arrays.stream(req.getOptions())
                .map(opt -> opt.trim().toLowerCase())
                .sorted()
                .toList();

        List<Poll> existingPolls =
                pollRepository.findByQuestionCaseInsensitive(req.getQuestion());

        for (Poll p : existingPolls) {
            List<String> existingOptions = Arrays.stream(p.getOptions())
                    .map(opt -> opt.trim().toLowerCase())
                    .sorted()
                    .toList();

            if (incoming.equals(existingOptions)) {
                throw new IllegalArgumentException(
                        "A poll with the same question and options already exists."
                );
            }
        }

        Signal signal = new Signal();
        signal.setCreatedBy(req.getCreatedBy());
        signal.setAnonymous(req.getAnonymous());
        signal.setEndDate(LocalDate.parse(req.getEndDate()));
        signal.setEndTime(LocalTime.parse(req.getEndTime()));
        signal.setTypeOfSignal(req.getTypeOfSignal());
        signal.setDefaultFlag(req.getDefaultFlag() != null ? req.getDefaultFlag() : false);
        signal.setSharedWith(req.getSharedWith());

        Signal saved = signalRepository.save(signal);

        Poll poll = new Poll();
        poll.setSignal(saved);
        poll.setQuestion(req.getQuestion());
        poll.setOptions(req.getOptions());
        poll.setDefaultOption(req.getDefaultOption());

        pollRepository.save(poll);

        if (req.getSharedWith() != null) {
            for (String email : req.getSharedWith()) {
                PollAssignment a = new PollAssignment();
                a.setSignalId(saved.getId());
                a.setUserEmail(email);
                pollAssignmentRepository.findBySignalIdAndUserEmail(saved.getId(), email)
                        .orElseGet(() -> pollAssignmentRepository.save(a));
            }
        }
        return saved.getId();
    }

    @Override
    public List<UserPollDTO> getAssignedPollsForUser(String userEmail) {
        List<PollAssignment> assignments = pollAssignmentRepository.findByUserEmailOrderByAssignedAtDesc(userEmail);
        List<UserPollDTO> out = new ArrayList<>();
        for (PollAssignment a : assignments) {
            Integer signalId = a.getSignalId();
            Poll poll = pollRepository.findById(signalId).orElse(null);
            if (poll == null) continue; // maybe deleted
            Signal signal = signalRepository.findById(signalId).orElse(null);
            if (signal == null) continue;
            UserPollDTO dto = new UserPollDTO();
            dto.setSignalId(signalId);
            dto.setQuestion(poll.getQuestion());
            dto.setOptions(poll.getOptions());
            dto.setAnonymous(signal.getAnonymous());
            dto.setEndDate(signal.getEndDate());
            dto.setEndTime(signal.getEndTime());

            List<PollResult> results = pollResultRepository.findBySignalId(signalId);
            Optional<PollResult> myVote = results.stream()
                    .filter(r -> userEmail.equals(r.getUserEmail()))
                    .findFirst();
            dto.setAlreadyVoted(myVote.isPresent());
            dto.setSelectedOption(myVote.map(PollResult::getSelectedOption).orElse(null));

            out.add(dto);
        }
        return out;
    }

    @Override
    public void submitOrUpdateVote(SubmitPollResponse req) {
        // 1. check poll exists and not expired
        Signal signal = signalRepository.findById(req.getSignalId())
                .orElseThrow(() -> new IllegalArgumentException("Poll not found"));

        // check end date/time: if endDate != null and endTime != null -> compare
        if (isPollExpired(signal)) {
            throw new IllegalArgumentException("Poll is closed for submissions");
        }

        // 2. check options validity
        Poll poll = pollRepository.findById(req.getSignalId())
                .orElseThrow(() -> new IllegalArgumentException("Poll data not found"));
        boolean optionValid = Arrays.stream(poll.getOptions())
                .anyMatch(o -> o.equalsIgnoreCase(req.getSelectedOption()));
        if (!optionValid) throw new IllegalArgumentException("Selected option is invalid");

        // 3. find existing result for user
        Optional<PollResult> existing = pollResultRepository.findBySignalId(req.getSignalId())
                .stream()
                .filter(r -> r.getUserEmail().equalsIgnoreCase(req.getUserEmail()))
                .findFirst();

        if (existing.isPresent()) {
            PollResult pr = existing.get();
            pr.setSelectedOption(req.getSelectedOption());
            pr.setTimeOfSubmission(LocalDateTime.now());
            pollResultRepository.save(pr);
        } else {
            PollResult pr = new PollResult();
            pr.setSignalId(req.getSignalId());
            pr.setUserEmail(req.getUserEmail());
            pr.setSelectedOption(req.getSelectedOption());
            pollResultRepository.save(pr);
            // mark assignment submitted if exists
            pollAssignmentRepository.findBySignalIdAndUserEmail(req.getSignalId(), req.getUserEmail())
                    .ifPresent(a -> {
                        a.setSubmitted(true);
                        pollAssignmentRepository.save(a);
                    });
        }
    }

    private boolean isPollExpired(Signal signal) {
        if (signal.getEndDate() == null) return false;
        LocalDate nowDate = LocalDate.now();
        LocalTime nowTime = LocalTime.now();
        if (nowDate.isAfter(signal.getEndDate())) return true;
        if (nowDate.isEqual(signal.getEndDate()) && signal.getEndTime() != null && nowTime.isAfter(signal.getEndTime()))
            return true;
        return false;
    }

    @Override
    public PollResultDTO getPollResults(Integer signalId) {
        Signal signal = signalRepository.findById(signalId)
                .orElseThrow(() -> new IllegalArgumentException("Poll not found"));
        Poll poll = pollRepository.findById(signalId)
                .orElseThrow(() -> new IllegalArgumentException("Poll data not found"));

        List<PollResult> results = pollResultRepository.findBySignalId(signalId);
        Map<String, Integer> optionCounts = new LinkedHashMap<>();
        Map<String, List<String>> optionToUsers = new LinkedHashMap<>();

        // initialize
        for (String opt : poll.getOptions()) {
            optionCounts.put(opt, 0);
            optionToUsers.put(opt, new ArrayList<>());
        }

        for (PollResult r : results) {
            String matched = poll.getOptions()[0]; // fallback
            // find exact option by case-insensitive match
            for (String opt : poll.getOptions()) {
                if (opt.equalsIgnoreCase(r.getSelectedOption())) {
                    matched = opt;
                    break;
                }
            }
            optionCounts.put(matched, optionCounts.getOrDefault(matched, 0) + 1);
            optionToUsers.get(matched).add(r.getUserEmail());
        }

        PollResultDTO dto = new PollResultDTO();
        dto.setSignalId(signalId);
        dto.setTotalAssigned(pollAssignmentRepository.findBySignalId(signalId).size());
        dto.setTotalResponded(results.size());
        dto.setOptionCounts(optionCounts);
        if (Boolean.TRUE.equals(signal.getAnonymous())) {
            dto.setOptionToUsers(null); // do not return user lists
        } else {
            // convert lists to arrays
            Map<String, String[]> map = new LinkedHashMap<>();
            optionToUsers.forEach((k, v) -> map.put(k, v.toArray(new String[0])));
            dto.setOptionToUsers(map);
        }
        return dto;
    }

    @Override
    public List<YourDashboardDTO> listSignalsForCreator(String createdBy) {
        // simple dashboard: list signals by createdBy with assigned/responded counts and status
        List<Signal> signals = signalRepository.findAll()
                .stream()
                .filter(s -> createdBy.equals(s.getCreatedBy()))
                .collect(Collectors.toList());

        List<YourDashboardDTO> out = new ArrayList<>();
        for (Signal s : signals) {
            Integer id = s.getId();
            int assigned = pollAssignmentRepository.findBySignalId(id).size();
            int responded = pollResultRepository.findBySignalId(id).size();
            YourDashboardDTO d = new YourDashboardDTO();
            d.setSignalId(id);
            d.setTypeOfSignal(s.getTypeOfSignal());
            d.setCreatedDate(s.getCreatedDate());
            d.setAssignedCount(assigned);
            d.setRespondedCount(responded);
            d.setExpired(isPollExpired(s));
            out.add(d);
        }
        return out;
    }
}


