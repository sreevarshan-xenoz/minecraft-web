// Wait for DOM to load
document.addEventListener('DOMContentLoaded', () => {
    // Initialize game
    const game = new Game();
    
    // Make game instance globally available
    window.game = game;
    
    // Initialize UI
    const ui = new UI(game);
    
    // Game is not automatically started now - user must click "Start Game" button
    
    // Log instructions to console
    console.log('Minecraft Web started!');
    console.log('Controls:');
    console.log('- WASD: Move');
    console.log('- Space: Jump');
    console.log('- Left Click: Break block');
    console.log('- Right Click: Place block');
    console.log('- 1,2,3: Select block type');
    console.log('- ESC: Pause game');
});