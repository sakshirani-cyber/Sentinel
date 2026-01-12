package com.sentinel.backend.service;

import com.sentinel.backend.dto.request.LabelCreateDTO;
import com.sentinel.backend.dto.request.LabelEditDTO;
import com.sentinel.backend.dto.response.LabelResponseDTO;

import java.util.List;

public interface LabelService {

    void createLabel(LabelCreateDTO labelCreateDTO);
    List<LabelResponseDTO> getAllLabels();
    void editLabel(LabelEditDTO dto);
}
