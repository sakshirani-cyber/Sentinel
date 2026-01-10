package com.sentinel.backend.service;

import com.sentinel.backend.dto.request.LabelCreateDTO;
import com.sentinel.backend.dto.response.LabelResponseDTO;
import com.sentinel.backend.entity.LabelEntity;
import com.sentinel.backend.exception.CustomException;
import com.sentinel.backend.repository.LabelRepository;
import com.sentinel.backend.util.NormalizationUtils;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
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

        if (labelRepository.existsByLabel(normalizedLabel)) {
            throw new CustomException("Label already exists", HttpStatus.BAD_REQUEST);
        }

        LabelEntity entity = new LabelEntity();
        entity.setLabel(normalizedLabel);
        entity.setDescription(NormalizationUtils.trimToNull(dto.getDescription()));
        entity.setCreatedAt(java.time.Instant.now());
        entity.setColor(dto.getColor().toUpperCase());

        labelRepository.save(entity);
    }

    @Override
    @Transactional(readOnly = true)
    public List<LabelResponseDTO> getAllLabels() {

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

        return labels;
    }
}
