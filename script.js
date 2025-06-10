// Wait for DOM to load
document.addEventListener('DOMContentLoaded', () => {
    // Initialize game
    const game = new Game();
    
    // Initialize UI
    const ui = new UI(game);
    
    // Show welcome message
    ui.showMessage('Welcome to Minecraft Web! Click to start playing.', 5000);
    
    // Log instructions to console
    console.log('Minecraft Web started!');
    console.log('Controls:');
    console.log('- WASD: Move');
    console.log('- Space: Jump');
    console.log('- Left Click: Break block');
    console.log('- Right Click: Place block');
    console.log('- 1,2,3: Select block type');
});