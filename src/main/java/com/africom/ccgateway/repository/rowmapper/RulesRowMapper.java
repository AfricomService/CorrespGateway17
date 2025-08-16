package com.africom.ccgateway.repository.rowmapper;

import com.africom.ccgateway.domain.Rules;
import io.r2dbc.spi.Row;
import java.util.function.BiFunction;
import org.springframework.stereotype.Service;

/**
 * Converter between {@link Row} to {@link Rules}, with proper type conversions.
 */
@Service
public class RulesRowMapper implements BiFunction<Row, String, Rules> {

    private final ColumnConverter converter;

    public RulesRowMapper(ColumnConverter converter) {
        this.converter = converter;
    }

    /**
     * Take a {@link Row} and a column prefix, and extract all the fields.
     * @return the {@link Rules} stored in the database.
     */
    @Override
    public Rules apply(Row row, String prefix) {
        Rules entity = new Rules();
        entity.setId(converter.fromRow(row, prefix + "_id", Long.class));
        entity.setName(converter.fromRow(row, prefix + "_name", String.class));
        entity.setCode(converter.fromRow(row, prefix + "_code", String.class));
        entity.setIsActif(converter.fromRow(row, prefix + "_is_actif", Boolean.class));
        entity.setFileContentType(converter.fromRow(row, prefix + "_file_content_type", String.class));
        entity.setFile(converter.fromRow(row, prefix + "_file", byte[].class));
        return entity;
    }
}
