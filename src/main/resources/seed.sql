INSERT INTO users (id, email, password_hash, name, display_name, username, role, avatar_url, bio, streak) VALUES
('usr-1', 'admin@recipes.com', '$2a$10$BxPYWorQzGSr3k.u0VcF4.8A3SnOEDgcbwSKGP1shzYrifnRQ60Se', 'Sachin Bhandari (Admin)', 'Sachin Bhandari (Admin)', 'sachin', 'admin', '/uploads/avatars/sachin.svg', 'Lead Platform Architect & Chef Evaluator', 7),
('usr-2', 'aarav@recipes.com', '$2a$10$4tj98323jMdSsrHiLXbmFuACI58O.MLpKWVK.1MTX9jOBH6jJJfVi', 'Aarav Sharma', 'Aarav Sharma', 'aarav', 'user', '/uploads/avatars/anant.svg', 'Passionate Indian cuisine enthusiast', 5),
('usr-3', 'priya@recipes.com', '$2a$10$4tj98323jMdSsrHiLXbmFuACI58O.MLpKWVK.1MTX9jOBH6jJJfVi', 'Priya Patel', 'Priya Patel', 'priya', 'user', '/uploads/avatars/a1.svg', 'Home cook experimenting with healthy bakes', 3),
('usr-4', 'rohan@recipes.com', '$2a$10$4tj98323jMdSsrHiLXbmFuACI58O.MLpKWVK.1MTX9jOBH6jJJfVi', 'Rohan Kulkarni', 'Rohan Kulkarni', 'rohan', 'user', '/uploads/avatars/adi.svg', 'Street food lover and quick recipes creator', 2),
('usr-5', 'ananya@recipes.com', '$2a$10$4tj98323jMdSsrHiLXbmFuACI58O.MLpKWVK.1MTX9jOBH6jJJfVi', 'Ananya Verma', 'Ananya Verma', 'ananya', 'user', '/uploads/avatars/prakash.svg', 'Dessert specialist and tea sommelier', 4)
ON DUPLICATE KEY UPDATE name=VALUES(name);

INSERT INTO recipes (id, author_id, author_name, username, title, description, category, meal_type, prep_time, cooking_time, servings, difficulty, ingredients_json, instructions_json, dietary_json, image_url, photos_json, status, rejection_reason, likes_count, average_rating) VALUES
('rec-2', 'usr-1', 'Sachin Bhandari (Admin)', 'sachin', 'Classic Wood-Fired Margherita Pizza', 'Crispy 48-hour fermented sourdough crust topped with San Marzano tomatoes, fresh buffalo mozzarella, and basil.', 'dinner', 'Dinner', 20, '12 mins', 2, 'Medium', '["250g 48hr fermented pizza dough", "100g San Marzano tomato sauce", "125g Fresh buffalo mozzarella", "Fresh basil leaves", "1 tbsp Extra virgin olive oil", "Sea salt"]', '["Preheat oven with pizza stone to maximum temperature (250°C+).", "Stretch sourdough dough gently by hand preserving air pockets.", "Spread crushed San Marzano tomato sauce evenly.", "Tear mozzarella over sauce, drizzle extra virgin olive oil, and bake for 8-12 minutes.", "Garnish with fresh basil and sea salt."]', '["Vegetarian"]', '/uploads/pizza_1789972478_1.jpg', '["/uploads/pizza_1789972478_1.jpg"]', 'approved', NULL, 28, 4.85),
('rec-3', 'usr-3', 'Priya Patel', 'priya', 'Fiery Garlic Sesame Chili Noodles', 'Springy hand-pulled noodles tossed with scorching hot chili oil, scallions, toasted sesame, and soy.', 'lunch', 'Lunch', 10, '8 mins', 1, 'Easy', '["200g Wheat noodles", "3 tbsp Chili flakes", "4 Garlic cloves minced", "2 tbsp Light soy sauce", "1 tbsp Black vinegar", "3 tbsp Sizzling hot vegetable oil", "1 tsp Toasted sesame seeds", "Chopped scallions"]', '["Boil noodles until al dente, drain and place in a heatproof serving bowl.", "Top noodles with minced garlic, chili flakes, scallions, and sesame seeds.", "Heat vegetable oil until smoking, pour directly over aromatics to sizzle.", "Add soy sauce and black vinegar, toss thoroughly and serve immediately."]', '["Vegetarian", "Vegan"]', '/uploads/chillinoodles_1789972478_0.jpg', '["/uploads/chillinoodles_1789972478_0.jpg"]', 'approved', NULL, 22, 4.75),
('rec-4', 'usr-5', 'Ananya Verma', 'ananya', 'Artisanal Double Dark Chocolate Fudge Cake', 'Rich, decadent multi-layer chocolate cake glazed with 70% dark Belgian ganache and sea salt flakes.', 'desserts', 'Dessert', 25, '35 mins', 8, 'Hard', '["2 cups All-purpose flour", "2 cups Granulated sugar", "3/4 cup Dutch-process cocoa powder", "2 tsp Baking powder", "2 Large eggs", "1 cup Whole milk", "1/2 cup Vegetable oil", "1 cup Boiling coffee", "200g 70% Dark chocolate ganache"]', '["Preheat oven to 175°C (350°F) and grease two 9-inch cake pans.", "Whisk together dry ingredients in a large mixing bowl.", "Add eggs, milk, and oil; beat on medium speed for 2 minutes.", "Stir in boiling coffee gently. Batter will be thin.", "Bake for 30-35 minutes until a toothpick inserted in center comes out clean.", "Cool completely, frost with warm chocolate ganache and chocolate curls."]', '["Vegetarian"]', '/uploads/dish_1789998754631_4331.jpg', '["/uploads/dish_1789998754631_4331.jpg"]', 'approved', NULL, 19, 4.95),
('rec-5', 'usr-4', 'Rohan Kulkarni', 'rohan', 'Double Smash Gourmet Cheeseburger', 'Two 100% smashed patties with caramelized crispy edges, melted American cheese, pickles, and secret sauce on brioche.', 'lunch', 'Lunch', 10, '10 mins', 1, 'Medium', '["200g Ground chuck beef or plant-based patty", "2 Slices American cheese", "1 Brioche bun", "2 tbsp FoodBite secret sauce", "Pickle chips", "Thinly sliced red onion", "Butter for toasting"]', '["Divide beef into two loose 100g balls.", "Heat cast iron skillet until smoking hot.", "Place balls in dry skillet and smash paper thin with heavy spatula.", "Season liberally with salt and pepper, cook 2 minutes until deeply browned.", "Flip, immediately add cheese slices, stack patties, and transfer to toasted brioche bun with secret sauce and pickles."]', '["Dairy-Free Option"]', '/uploads/dish_1789998495727_7363.png', '["/uploads/dish_1789998495727_7363.png"]', 'pending', NULL, 5, 4.20),
('rec-6', 'usr-2', 'Aarav Sharma', 'aarav', 'Immunity Booster Spiced Chamomile Herbal Tea', 'Calming loose-leaf chamomile infusion with crushed ginger, fresh mint, organic honey, and Ceylon cinnamon.', 'drinks', 'Drink', 5, '5 mins', 2, 'Easy', '["2 tbsp Dried chamomile flowers", "1 inch Fresh crushed ginger", "1 Ceylon cinnamon stick", "4 Fresh mint sprigs", "2 cups Spring water", "1 tbsp Raw organic honey"]', '["Bring spring water to a rolling boil with crushed ginger and cinnamon stick.", "Remove from heat, add dried chamomile flowers and fresh mint leaves.", "Cover and steep for 5 minutes.", "Strain into heatproof glass cups, stir in raw honey, and serve warm."]', '["Vegetarian", "Vegan", "Gluten-Free"]', '/uploads/dish_1790000052225_4905.jpg', '["/uploads/dish_1790000052225_4905.jpg"]', 'rejected', 'Please specify exact water temperatures and precise steeping guidelines for optimal flavor extraction.', 3, 3.80)
ON DUPLICATE KEY UPDATE title=VALUES(title);

INSERT INTO reviews (id, recipe_id, user_id, user_name, user_avatar, rating, comment) VALUES
('rev-2', 'rec-2', 'usr-3', 'Priya Patel', '/uploads/avatars/a1.svg', 5, 'The 48-hour fermented crust produces perfect leopard spotting in a standard home oven. A true Italian masterpiece!'),
('rev-3', 'rec-3', 'usr-4', 'Rohan Kulkarni', '/uploads/avatars/adi.svg', 5, 'Sizzling hot chili oil poured over fresh minced garlic is unbeatable. Quick, bold, and incredibly satisfying!'),
('rev-4', 'rec-4', 'usr-2', 'Aarav Sharma', '/uploads/avatars/anant.svg', 5, 'Decadent, moist, and perfectly complemented by the dark Belgian chocolate glaze. Everyone in my family loved it!')
ON DUPLICATE KEY UPDATE comment=VALUES(comment);

INSERT INTO activities (id, user_id, description) VALUES
('act-3', 'usr-1', 'Sachin Bhandari (Admin) approved Classic Wood-Fired Margherita Pizza'),
('act-4', 'usr-3', 'Priya Patel published Fiery Garlic Sesame Chili Noodles'),
('act-5', 'usr-5', 'Ananya Verma shared Artisanal Double Dark Chocolate Fudge Cake')
ON DUPLICATE KEY UPDATE description=VALUES(description);

INSERT INTO settings (setting_key, setting_value) VALUES
('platform_name', 'FoodBite — Online Recipe Sharing Platform'),
('admin_email', 'admin@recipes.com'),
('max_photos', '5'),
('allow_guest_browsing', 'true'),
('auto_approve_recipes', 'false'),
('maintenance_mode', 'false'),
('enable_photo_uploads', 'true'),
('content_moderation', 'true')
ON DUPLICATE KEY UPDATE setting_value=VALUES(setting_value);

INSERT INTO ephemeral_posts (id, user_id, username, user_avatar, media_url, media_path, media_type, category, caption, duration, created_at, expires_at) VALUES
('post-2', 'usr-1', 'sachin', '/uploads/avatars/sachin.svg', '/uploads/pizza_1789972478_1.jpg', 'uploads/pizza_1789972478_1.jpg', 'image', 'dinner', 'Classic Wood-Fired Margherita Pizza • Crispy 48-hour fermented sourdough crust topped with San Marzano tomatoes, fresh buffalo mozzarella, and basil.', 0.0, 1790504605064, 1791714205064),
('post-3', 'usr-3', 'priya', '/uploads/avatars/priya.svg', '/uploads/chillinoodles_1789972478_0.jpg', 'uploads/chillinoodles_1789972478_0.jpg', 'image', 'quick', 'Fiery Garlic Sesame Chili Noodles • Springy hand-pulled noodles tossed with scorching hot chili oil, scallions, toasted sesame, and soy.', 0.0, 1790504605064, 1791714205064)
ON DUPLICATE KEY UPDATE caption=VALUES(caption);

INSERT INTO announcements (id, enabled, title, message, type, updated_by, updated_at) VALUES
(1, FALSE, 'Site Maintenance Notice', 'Sorry, our site is under maintenance. We will be back shortly!', 'maintenance', 'Sachin Bhandari (Admin)', 1790016490175)
ON DUPLICATE KEY UPDATE title=VALUES(title);
