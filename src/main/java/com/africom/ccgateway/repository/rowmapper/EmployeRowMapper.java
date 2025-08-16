package com.africom.ccgateway.repository.rowmapper;

import com.africom.ccgateway.domain.Employe;
import io.r2dbc.spi.Row;
import java.util.function.BiFunction;
import org.springframework.stereotype.Service;

/**
 * Converter between {@link Row} to {@link Employe}, with proper type conversions.
 */
@Service
public class EmployeRowMapper implements BiFunction<Row, String, Employe> {

    private final ColumnConverter converter;

    public EmployeRowMapper(ColumnConverter converter) {
        this.converter = converter;
    }

    /**
     * Take a {@link Row} and a column prefix, and extract all the fields.
     * @return the {@link Employe} stored in the database.
     */
    @Override
    public Employe apply(Row row, String prefix) {
        Employe entity = new Employe();
        entity.setId(converter.fromRow(row, prefix + "_id", Long.class));
        entity.setJobTitle(converter.fromRow(row, prefix + "_job_title", String.class));
        entity.setEmail(converter.fromRow(row, prefix + "_email", String.class));
        entity.setPhoneNumber(converter.fromRow(row, prefix + "_phone_number", String.class));
        return entity;
    }
}
