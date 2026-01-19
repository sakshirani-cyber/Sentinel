package com.sentinel.backend.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class ApiResponse<T> {
    private boolean success;
    private String message;
    private T data;

    public static <T> ApiResponse<T> success(String message, T data){
        return ApiResponse.<T>builder().success(true).message(message).data(data).build();
    }
    public static <T> ApiResponse<T> failure(String message){
        return ApiResponse.<T>builder().success(false).message(message).data(null).build();
    }
}
