package com.sentinel.backend.dto.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
public class PollEditDTO extends PollCreateDTO{

    @NotBlank(message = "Last Edited By is required")
    @Email(message = "Invalid email format")
    private String lastEditedBy;

    @NotNull(message = "Republish is required")
    private Boolean republish;

    @NotNull(message = "Signal Id is required")
    private Long signalId;
}
