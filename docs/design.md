# Blue Doc

## Components

- frontend
  - using: Svelte
  - using: PeerJS
  - using: TypeScript
- backend
  - backend:octarine (public-facing)
    - using: TypeScript / Node.js / NestJS
    - user login / identification
    - user profile updates
    - user location update + blind-io proxy
    - websocket:proxy (do we even need this?)
  - backend:blind-io (internal only)
    - using: Go / gRPC
    - quadtree user search
    - decides which users are visible to which
  - backend:peer-server (third-party)
    - using: PeerJS / PeerServer Cloud
    - connects users
- storage
  - redis
    - store user locations
    - key: `user:coords:${user-id}`, value: coords
    - key: `user:peer-ids:${user-id}`, value: list of user's active peer-ids
  - postgres
    - store:user-id
    - store:peer-id
    - store:email-address
    - store:display-name
    - store:credentials
    - store:profile?
      - profile-photo
      - profile-text
    - store:persistent-peer
      - list of user-ids
    - store:last-known-location
      - latitude
      - longitude

## Connections

### User-Backend

#### Logging-in

- user connects to backend
- backend requests credential
- if user refuses, backend treats user as anonymous
- if user accepts, go through normal log in process

#### Tracking Users

- user connects to peerserver and gets unique id (peer-id)
- user gives peer-id (and some other id like username) to backend
- backend registers peer-id for username
- backend responds a list of peer-id where the user can connect to

#### Requesting users to connect to

- user requests backend a list of users to connect to
- backend searches nearby (or some other criteria) users
- backend alerts users of this user possibly connecting
- backend responds a list of peer-id where the user can connect to

### User-User

#### Connecting to other users

- user tries to connect to peer-id
- on success, add peer-connection to internal map
- on fail, ??? report fail to server ???

#### Accepting connection from other users

- receive peer request from another user
- decide if can connect or not (based on some criteria)

#### Posting transient data

- user broadcasts data to all other connected peers

#### Re-hosting transient data

- user recieves transient data from a peer
- check if data has been received before
  - have some kind of buffer that stores hashes of received messages
- if data is marked as private, receive but do not re-broadcast
- if data has been received before, ignore
- if data has been expired, ignore
- if data is still valid, send to connected peers

#### Hosting server-like rooms (SeLR)

- user broadcasts peer-id + server-like room details to peers

### SeLR-User

#### Accepting connections from other users

- SeLR receives peer request from another user
- decide if can connect or not (based on some criteria)

#### Publishing updates to connected users

- SeLR broadcasts update to connected peer users

#### Communicating with connected users

- SeLR receives message from a peer
- SeLR responds another message to the peer

## Notes

- Limit connections to 200
  - Pin connections up to 20?
  - Dynamic connections up to 20
- We can use open street map
