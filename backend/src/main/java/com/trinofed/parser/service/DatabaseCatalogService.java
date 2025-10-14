package com.trinofed.parser.service;

import com.trinofed.parser.model.Database;
import com.trinofed.parser.model.Database.Schema;
import com.trinofed.parser.model.Database.Table;
import com.trinofed.parser.model.Database.Column;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

@Slf4j
@Service
public class DatabaseCatalogService {

    private final DatabaseService databaseService;
    private final Map<String, Database> catalogCache = new ConcurrentHashMap<>();
    private long lastRefreshTime = 0;
    private static final long CACHE_REFRESH_INTERVAL = 300000; // 5 minutes

    @Autowired
    public DatabaseCatalogService(DatabaseService databaseService) {
        this.databaseService = databaseService;
        initializeDefaultCatalogs();
    }

    public List<Database> getAllDatabases() {
        log.info("Getting all databases from catalog service");
        
        // Check if cache needs refresh
        if (shouldRefreshCache()) {
            refreshCatalogCache();
        }
        
        List<Database> databases = new ArrayList<>(catalogCache.values());
        log.info("Returning {} databases from catalog cache", databases.size());
        return databases;
    }

    public Database getDatabaseById(String catalogId) {
        log.debug("Getting database by catalog id: {}", catalogId);
        
        if (shouldRefreshCache()) {
            refreshCatalogCache();
        }
        
        return catalogCache.get(catalogId);
    }

    public void refreshCatalogCache() {
        log.info("Refreshing catalog cache");
        
        try {
            // In a real implementation, this would connect to Trino and discover catalogs
            // For now, we'll create some sample catalogs based on common setups
            
            catalogCache.clear();
            
            // Add default catalogs that are commonly available
            addCatalogToCache(createPostgresCatalog());
            addCatalogToCache(createMySQLCatalog());
            addCatalogToCache(createSystemCatalog());
            
            lastRefreshTime = System.currentTimeMillis();
            log.info("Catalog cache refreshed with {} catalogs", catalogCache.size());
            
        } catch (Exception e) {
            log.error("Error refreshing catalog cache", e);
        }
    }

    private boolean shouldRefreshCache() {
        return (System.currentTimeMillis() - lastRefreshTime) > CACHE_REFRESH_INTERVAL 
               || catalogCache.isEmpty();
    }

    private void addCatalogToCache(Database database) {
        if (database != null && database.getId() != null) {
            catalogCache.put(database.getId(), database);
            databaseService.addDatabase(database);
        }
    }

    private Database createPostgresCatalog() {
        Instant now = Instant.now();
        
        List<Column> customerColumns = Arrays.asList(
            Column.builder().name("id").type("integer").nullable(false).build(),
            Column.builder().name("name").type("varchar(100)").nullable(false).build(),
            Column.builder().name("email").type("varchar(100)").nullable(false).build(),
            Column.builder().name("city").type("varchar(50)").nullable(true).build(),
            Column.builder().name("country").type("varchar(50)").nullable(true).build(),
            Column.builder().name("created_at").type("timestamp").nullable(true).build()
        );

        List<Column> orderColumns = Arrays.asList(
            Column.builder().name("id").type("integer").nullable(false).build(),
            Column.builder().name("customer_id").type("integer").nullable(false).build(),
            Column.builder().name("product").type("varchar(100)").nullable(false).build(),
            Column.builder().name("amount").type("decimal(10,2)").nullable(false).build(),
            Column.builder().name("order_date").type("date").nullable(false).build()
        );

        List<Table> publicTables = Arrays.asList(
            Table.builder()
                .name("customers")
                .columns(customerColumns)
                .rowCount(1000L)
                .firstSeen(now)
                .lastSeen(now)
                .totalQueries(0)
                .build(),
            Table.builder()
                .name("orders")
                .columns(orderColumns)
                .rowCount(5000L)
                .firstSeen(now)
                .lastSeen(now)
                .totalQueries(0)
                .build()
        );

        List<Schema> schemas = Arrays.asList(
            Schema.builder()
                .name("public")
                .tables(publicTables)
                .firstSeen(now)
                .lastSeen(now)
                .totalQueries(0)
                .build(),
            Schema.builder()
                .name("analytics")
                .tables(new ArrayList<>())
                .firstSeen(now)
                .lastSeen(now)
                .totalQueries(0)
                .build()
        );

        return Database.builder()
                .id("postgres")
                .name("PostgreSQL")
                .type("postgresql")
                .host("localhost")
                .port(5432)
                .schemas(schemas)
                .status("ACTIVE")
                .firstSeen(now)
                .lastSeen(now)
                .totalQueries(0)
                .build();
    }

    private Database createMySQLCatalog() {
        Instant now = Instant.now();
        
        List<Column> productColumns = Arrays.asList(
            Column.builder().name("id").type("int").nullable(false).build(),
            Column.builder().name("name").type("varchar(255)").nullable(false).build(),
            Column.builder().name("price").type("decimal(10,2)").nullable(false).build(),
            Column.builder().name("category").type("varchar(100)").nullable(true).build()
        );

        List<Table> tables = Arrays.asList(
            Table.builder()
                .name("products")
                .columns(productColumns)
                .rowCount(2500L)
                .firstSeen(now)
                .lastSeen(now)
                .totalQueries(0)
                .build()
        );

        List<Schema> schemas = Arrays.asList(
            Schema.builder()
                .name("inventory")
                .tables(tables)
                .firstSeen(now)
                .lastSeen(now)
                .totalQueries(0)
                .build()
        );

        return Database.builder()
                .id("mysql")
                .name("MySQL")
                .type("mysql")
                .host("localhost")
                .port(3306)
                .schemas(schemas)
                .status("ACTIVE")
                .firstSeen(now)
                .lastSeen(now)
                .totalQueries(0)
                .build();
    }

    private Database createSystemCatalog() {
        Instant now = Instant.now();
        
        List<Schema> schemas = Arrays.asList(
            Schema.builder()
                .name("metadata")
                .tables(new ArrayList<>())
                .firstSeen(now)
                .lastSeen(now)
                .totalQueries(0)
                .build(),
            Schema.builder()
                .name("information_schema")
                .tables(new ArrayList<>())
                .firstSeen(now)
                .lastSeen(now)
                .totalQueries(0)
                .build()
        );

        return Database.builder()
                .id("system")
                .name("System")
                .type("system")
                .schemas(schemas)
                .status("ACTIVE")
                .firstSeen(now)
                .lastSeen(now)
                .totalQueries(0)
                .build();
    }

    private void initializeDefaultCatalogs() {
        log.info("Initializing default catalogs");
        refreshCatalogCache();
    }

    public void addCatalog(Database catalog) {
        if (catalog != null && catalog.getId() != null) {
            catalogCache.put(catalog.getId(), catalog);
            databaseService.addDatabase(catalog);
            log.info("Added catalog: {}", catalog.getId());
        }
    }

    public void removeCatalog(String catalogId) {
        catalogCache.remove(catalogId);
        databaseService.removeDatabase(catalogId);
        log.info("Removed catalog: {}", catalogId);
    }

    public boolean catalogExists(String catalogId) {
        return catalogCache.containsKey(catalogId);
    }

    public int getTotalCatalogs() {
        return catalogCache.size();
    }
}
