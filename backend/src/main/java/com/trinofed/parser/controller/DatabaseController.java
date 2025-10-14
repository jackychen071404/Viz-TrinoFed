package com.trinofed.parser.controller;

import com.trinofed.parser.model.Database;
import com.trinofed.parser.model.Database.Schema;
import com.trinofed.parser.service.DatabaseCatalogService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@Slf4j
@RestController
@RequestMapping("/api/databases")
@CrossOrigin(origins = "http://localhost:5173")
public class DatabaseController {

    private final DatabaseCatalogService databaseCatalogService;

    @Autowired
    public DatabaseController(DatabaseCatalogService databaseCatalogService) {
        this.databaseCatalogService = databaseCatalogService;
    }

    @GetMapping
    public ResponseEntity<List<Database>> getAllDatabases() {
        log.info("Fetching all databases");
        try {
            List<Database> databases = databaseCatalogService.getAllDatabases();
            log.info("Returning {} databases", databases.size());
            return ResponseEntity.ok(databases);
        } catch (Exception e) {
            log.error("Error fetching databases", e);
            return ResponseEntity.internalServerError().build();
        }
    }

    @GetMapping("/{id}")
    public ResponseEntity<Database> getDatabaseById(@PathVariable String id) {
        log.info("Fetching database with id: {}", id);
        try {
            Database database = databaseCatalogService.getDatabaseById(id);
            
            if (database == null) {
                log.warn("Database with id {} not found", id);
                return ResponseEntity.notFound().build();
            }
            
            return ResponseEntity.ok(database);
        } catch (Exception e) {
            log.error("Error fetching database with id: {}", id, e);
            return ResponseEntity.internalServerError().build();
        }
    }

    @GetMapping("/{id}/schemas")
    public ResponseEntity<List<Schema>> getSchemas(@PathVariable String id) {
        log.info("Fetching schemas for database: {}", id);
        try {
            Database database = databaseCatalogService.getDatabaseById(id);
            
            if (database == null) {
                log.warn("Database with id {} not found", id);
                return ResponseEntity.notFound().build();
            }
            
            List<Schema> schemas = database.getSchemas();
            return ResponseEntity.ok(schemas);
        } catch (Exception e) {
            log.error("Error fetching schemas for database: {}", id, e);
            return ResponseEntity.internalServerError().build();
        }
    }
}
