package com.sentinel.backend.util;

import java.util.HashSet;
import java.util.LinkedHashSet;
import java.util.Set;

public final class NormalizationUtils {

    private NormalizationUtils() {}

    public static String trimToNull(String s) {
        if (s == null) return null;
        String t = s.trim();
        return t.isEmpty() ? null : t;
    }

    public static String[] trimArray(String[] arr) {
        if (arr == null) return null;
        String[] out = new String[arr.length];
        for (int i = 0; i < arr.length; i++) {
            out[i] = trimToNull(arr[i]);
        }
        return out;
    }

    public static void validateNoBlanks(String[] arr, String fieldName) {
        if (arr == null) return;
        for (String s : arr) {
            if (s == null) {
                throw new IllegalArgumentException(
                        fieldName + " contains empty/blank value(s)"
                );
            }
        }
    }

    public static void validateUniqueIgnoreCase(String[] arr, String fieldName) {
        if (arr == null) return;

        Set<String> seen = new HashSet<>();
        for (String s : arr) {
            String key = s.toLowerCase();
            if (!seen.add(key)) {
                throw new IllegalArgumentException(
                        fieldName + " contains duplicate values (case-insensitive)"
                );
            }
        }
    }

    public static void validateUniqueCaseSensitive(String[] arr, String fieldName) {
        if (arr == null) return;

        Set<String> seen = new HashSet<>();
        for (String s : arr) {
            if (!seen.add(s)) {
                throw new IllegalArgumentException(
                        fieldName + " contains duplicate values (case-sensitive)"
                );
            }
        }
    }

    public static String[] trimAndUniquePreserveOrder(String[] arr) {
        if (arr == null) return null;

        LinkedHashSet<String> set = new LinkedHashSet<>();
        for (String s : arr) {
            String t = trimToNull(s);
            if (t != null) {
                set.add(t);
            }
        }
        return set.toArray(new String[0]);
    }
}
