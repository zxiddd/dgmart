try {
    console.log('Validating restaurantController.js...');
    require('./src/controllers/restaurantController');
    console.log('✅ restaurantController.js is valid.');

    console.log('Validating upload.routes.js...');
    require('./src/routes/upload.routes');
    console.log('✅ upload.routes.js is valid.');

    console.log('All checks passed. Backend code syntax is correct.');
} catch (error) {
    console.error('❌ Syntax Error in backend code:', error);
    process.exit(1);
}
