# Reality Fork Backend

RESTful API backend for Reality Fork version control system.

## Quick Start

1. **Start MongoDB:**
   ```bash
   docker-compose up -d
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Start development server:**
   ```bash
   npm run dev
   ```

4. **API is available at:** `http://localhost:5000`

## API Endpoints

### Versions
- `GET /api/versions` - Get all versions
- `POST /api/versions` - Create new version
- `GET /api/versions/:versionId` - Get single version
- `DELETE /api/versions/:versionId` - Delete version
- `GET /api/versions/:versionId/chain` - Get version history
- `GET /api/versions/diff/:id1/:id2` - Get diff
- `POST /api/versions/merge` - Merge versions

### Branches
- `GET /api/branches` - Get all branches
- `POST /api/branches` - Create branch
- `GET /api/branches/active` - Get active branch
- `GET /api/branches/:name` - Get single branch
- `PUT /api/branches/:name` - Update branch
- `DELETE /api/branches/:name` - Delete branch
- `PUT /api/branches/:name/activate` - Set active branch
