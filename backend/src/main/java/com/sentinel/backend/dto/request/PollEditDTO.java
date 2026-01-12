package com.sentinel.backend.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class PollEditDTO extends PollCreateDTO{

    @NotBlank(message = "Last Edited By is required")
    private String lastEditedBy;

    @NotNull(message = "Republish is required")
    private Boolean republish;

    @NotNull(message = "Signal Id is required")
    private Integer signalId;
}
