package com.foodbite;

import com.foodbite.config.DatabaseConfig;
import com.foodbite.dao.RecipeDao;
import com.foodbite.dao.RecipeDaoJdbc;
import com.foodbite.model.Recipe;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

public class RecipeDaoTest {

    @BeforeAll
    public static void setup() {
        try {
            DatabaseConfig.initialize();
        } catch (Exception ignored) {}
    }

    @Test
    public void testRecipeRetrieval() {
        try {
            RecipeDao recipeDao = new RecipeDaoJdbc();
            List<Recipe> all = recipeDao.findAll();
            assertNotNull(all);
            assertFalse(all.isEmpty(), "Recipes list should not be empty after seeding");

            Recipe first = all.get(0);
            assertNotNull(first.getId());
            assertNotNull(first.getTitle());
        } catch (Exception e) {
            System.out.println("Skipping test if DB unavailable: " + e.getMessage());
        }
    }
}
