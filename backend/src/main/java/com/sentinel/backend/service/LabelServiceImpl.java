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
        String normalizedLabel = NormalizationUtils.trimToNull(dto.getLabel());

        if (labelRepository.existsByLabel(normalizedLabel)) {
            throw new CustomException("Label already exists", HttpStatus.BAD_REQUEST);
        }

        Label entity = new Label();
        entity.setLabel(normalizedLabel);
        entity.setDescription(NormalizationUtils.trimToNull(dto.getDescription()));
        entity.setColor(dto.getColor().toUpperCase());

        labelRepository.save(entity);

        log.info("[LABEL][CREATE] labelId={} | label={}", entity.getId(), normalizedLabel);

        return new CreateLabelResponse(entity.getId(), dto.getLocalId());
    }

    @Override
    @Transactional(readOnly = true)
    public List<LabelResponseDTO> getAllLabels() {
        List<LabelResponseDTO> labels = labelRepository.findAll()
                .stream()
                .map(label -> new LabelResponseDTO(
                        label.getId(),
                        label.getLabel(),
                        label.getDescription(),
                        label.getColor(),
                        label.getCreatedAt(),
                        label.getEditedAt()
                ))
                .toList();

        log.debug("[LABEL][GET_ALL] count={}", labels.size());

        return labels;
    }

    @Override
    @Transactional
    public void editLabel(LabelEditDTO dto) {
        Label entity = labelRepository.findById(dto.getId())
                .orElseThrow(() -> new CustomException("Label not found", HttpStatus.NOT_FOUND));

        String newDescription = NormalizationUtils.trimToNull(dto.getDescription());
        String newColor = dto.getColor().toUpperCase();

        boolean changed = false;

        if (!newDescription.equals(entity.getDescription())) {
            entity.setDescription(newDescription);
            changed = true;
        }

        if (!newColor.equals(entity.getColor())) {
            entity.setColor(newColor);
            changed = true;
        }

        if (!changed) {
            throw new CustomException("No changes detected", HttpStatus.BAD_REQUEST);
        }

        entity.setEditedAt(Instant.now());
        labelRepository.save(entity);

        log.info("[LABEL][EDIT] labelId={}", dto.getId());
    }
}
