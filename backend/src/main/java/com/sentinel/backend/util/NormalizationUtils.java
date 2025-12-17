package com.sentinel.backend.util;

import java.util.Arrays;
import java.util.Collections;
import java.util.HashSet;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

public final class NormalizationUtils {

    private NormalizationUtils(){}

    public static String trimToNull(String s) {
        if (s == null) return null;
        String t = s.trim();
        return t.isEmpty() ? null : t;
    }

    public static String[] trimAndUnique(String[] arr) {
        if (arr == null) return new String[0];
        LinkedHashSet<String> set = new LinkedHashSet<>();
        for (String v : arr) {
            String t = trimToNull(v);
            if (t != null) set.add(t);
        }
        return set.toArray(new String[0]);
    }

    public static List<String> normalizeForComparison(String[] arr) {
        if (arr == null) return Collections.emptyList();
        return Arrays.stream(arr)
                .map(v -> v == null ? "" : v.trim().toLowerCase())
                .sorted()
                .collect(Collectors.toList());
    }

    public static String normalizeQuestion(String q) {
        if (q == null) return null;
        return q.trim().toLowerCase();
    }

    public static boolean hasDuplicatesIgnoreCase(String[] arr) {
        if (arr == null) return false;
        Set<String> set = new HashSet<>();
        for (String s : arr) {
            if (s == null) return false;
            String key = s.trim().toLowerCase();
            if (key.isEmpty()) return true;
            if (!set.add(key)) return true;
        }
        return false;
    }
}
