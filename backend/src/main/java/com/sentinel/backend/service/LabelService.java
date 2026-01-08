package com.sentinel.backend.service;

import com.sentinel.backend.dto.request.LabelCreateDTO;

public interface LabelService {

    void createLabel(LabelCreateDTO labelCreateDTO);
}
