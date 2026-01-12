package com.sentinel.backend.service;

import com.sentinel.backend.dto.request.LabelCreateDTO;
import com.sentinel.backend.dto.response.LabelResponseDTO;
import com.sentinel.backend.entity.LabelEntity;
import com.sentinel.backend.repository.LabelRepository;
import com.sentinel.backend.util.NormalizationUtils;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;


import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class LabelServiceImpl implements LabelService {

    private final LabelRepository labelRepository;

    @Override
    @Transactional
    public void createLabel(LabelCreateDTO dto) {

        String normalizedLabel = NormalizationUtils.trimToNull(dto.getLabel());

        log.info("[LABEL][SERVICE] label={}", normalizedLabel);

        if (labelRepository.existsByLabel(normalizedLabel)) {
            log.warn("[LABEL][DUPLICATE] label={}", normalizedLabel);
            throw new IllegalArgumentException("Label already exists");
        }

        LabelEntity entity = new LabelEntity();
        entity.setLabel(normalizedLabel);
        entity.setDescription(NormalizationUtils.trimToNull(dto.getDescription()));
        entity.setColor(dto.getColor().toUpperCase());

        labelRepository.save(entity);

        log.info("[LABEL][CREATED] label={}", entity.getLabel());
    }

    @Override
    @Transactional(readOnly = true)
    public List<LabelResponseDTO> getAllLabels() {

        log.debug("[LABEL][SERVICE][FETCH_ALL][START]");

        List<LabelResponseDTO> labels =
                labelRepository.findAll()
                        .stream()
                        .map(label -> new LabelResponseDTO(
                                label.getId(),
                                label.getLabel(),
                                label.getDescription(),
                                label.getColor(),
                                label.getCreatedAt()
                        ))
                        .toList();

        log.info(
                "[LABEL][SERVICE][FETCH_ALL][SUCCESS] count={}",
                labels.size()
        );

        return labels;
    }
}
