import app from './app.js';

const port = process.env.RENDER_SERVER_PORT || process.env.LOCAL_SERVER_PORT || 5000;
app.listen(port, () => console.log(`Server running on port ${port}`));