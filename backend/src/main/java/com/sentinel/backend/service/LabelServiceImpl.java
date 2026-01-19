package com.sentinel.backend.service;

import com.sentinel.backend.dto.request.LabelCreateDTO;
import com.sentinel.backend.dto.request.LabelEditDTO;
import com.sentinel.backend.dto.response.CreateLabelResponse;
import com.sentinel.backend.dto.response.LabelResponseDTO;
import com.sentinel.backend.entity.Label;
import com.sentinel.backend.exception.CustomException;
import com.sentinel.backend.repository.LabelRepository;
import com.sentinel.backend.util.NormalizationUtils;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class LabelServiceImpl implements LabelService {

    private final LabelRepository labelRepository;

    @Override
    @Transactional
    public CreateLabelResponse createLabel(LabelCreateDTO dto) {
        long start = System.currentTimeMillis();
        String normalizedLabel = NormalizationUtils.trimToNull(dto.getLabel());

        long checkStart = System.currentTimeMillis();
        if (labelRepository.existsByLabel(normalizedLabel)) {
            throw new CustomException("Label already exists", HttpStatus.BAD_REQUEST);
        }
        log.debug("[LABEL][DB_CHECK] label={} | durationMs={}", normalizedLabel, System.currentTimeMillis() - checkStart);

        Label entity = new Label();
        entity.setLabel(normalizedLabel);
        entity.setDescription(NormalizationUtils.trimToNull(dto.getDescription()));

        long saveStart = System.currentTimeMillis();
        labelRepository.save(entity);
        log.debug("[LABEL][DB_SAVE] labelId={} | durationMs={}", entity.getId(), System.currentTimeMillis() - saveStart);

        log.info("[LABEL][CREATE] labelId={} | label={} | totalDurationMs={}", entity.getId(), normalizedLabel, System.currentTimeMillis() - start);

        return new CreateLabelResponse(entity.getId(), dto.getLocalId());
    }

    @Override
    @Transactional(readOnly = true)
    public List<LabelResponseDTO> getAllLabels() {
        long start = System.currentTimeMillis();
        List<LabelResponseDTO> labels = labelRepository.findAll()
                .stream()
                .map(label -> new LabelResponseDTO(
                        label.getId(),
                        label.getLabel(),
                        label.getDescription(),
                        label.getCreatedAt(),
                        label.getEditedAt()
                ))
                .toList();

        log.info("[LABEL][DB_HIT] operation=GET_ALL | count={} | durationMs={}", labels.size(), System.currentTimeMillis() - start);

        return labels;
    }

    @Override
    @Transactional
    public void editLabel(LabelEditDTO dto) {
        long start = System.currentTimeMillis();

        long findStart = System.currentTimeMillis();
        Label entity = labelRepository.findById(dto.getId())
                .orElseThrow(() -> new CustomException("Label not found", HttpStatus.NOT_FOUND));
        log.debug("[LABEL][DB_FIND] labelId={} | durationMs={}", dto.getId(), System.currentTimeMillis() - findStart);

        String newDescription = NormalizationUtils.trimToNull(dto.getDescription());

        boolean changed = false;

        if (!newDescription.equals(entity.getDescription())) {
            entity.setDescription(newDescription);
            changed = true;
        }

        if (!changed) {
            throw new CustomException("No changes detected", HttpStatus.BAD_REQUEST);
        }

        entity.setEditedAt(Instant.now());

        long saveStart = System.currentTimeMillis();
        labelRepository.save(entity);
        log.debug("[LABEL][DB_SAVE] labelId={} | durationMs={}", dto.getId(), System.currentTimeMillis() - saveStart);

        log.info("[LABEL][EDIT] labelId={} | totalDurationMs={}", dto.getId(), System.currentTimeMillis() - start);
    }
}
