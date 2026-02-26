package com.autorepair.common.etag;

public interface Versionable {
    Long getVersion();
    void setVersion(Long version);
}
