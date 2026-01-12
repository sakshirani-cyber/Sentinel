package com.sentinel.backend.util;

import java.util.HashSet;
import java.util.LinkedHashSet;
import java.util.Set;

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
