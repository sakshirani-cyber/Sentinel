package com.sentinel.backend.constant;

public final class CacheKeys {

    private CacheKeys() {}

    public static final String POLL = "poll";
    public static final String POLL_RESULTS = "poll:results";
    public static final String POLL_RESULTS_CACHED = "cache:poll:results";
    public static final String USER_POLLS = "user:polls";
    public static final String SCHEDULED_POLL = "scheduled_poll";
    public static final String SSE_EVENTS = "sse:events";
    public static final String DATA_SYNC = "data_sync";
    public static final String SIGNAL_ID_COUNTER = "signal:id:counter";
    public static final String FAILED_OPS = "failed_ops";

    public static final String LOCK_SIGNAL_CREATE = "lock:signal:create";
    public static final String LOCK_VOTE_PREFIX = "lock:vote:";
    public static final String LOCK_POLL_EDIT_PREFIX = "lock:poll:edit:";
    public static final String LOCK_POLL_DELETE_PREFIX = "lock:poll:delete:";
    public static final String LOCK_SCHEDULED_PUBLISH_PREFIX = "lock:scheduled:publish:";
}
