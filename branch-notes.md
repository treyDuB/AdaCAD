# Notes while developing pedals interface for AdaCAD

Author(s): S

Any directory paths assume that `/` is the root of the local AdaCAD repository.

# notes from 2/23/22 meeting
## Rules of thumb for modifying code
- **Components** are responsible for rendering *views* into the design. They should NOT do any computation on the design data.
- **Services** do the actual data manipulation and are placed in folders named `provider`
    - `/core/provider`: Everything that interfaces with Firebase lives here. Generally, a new interaction with Firebase should mean a new service.
    - `/mixer/provider`: 
- Use Angular's built-in file generator commands! (link?)
- New datatypes are implemented as **interfaces**. (why?)

## INSTALLATION
### LIST A:
1. Make new branch on AdaCAD repo
2. Pull branch from remote to local directory (`/` = `AdaCAD-weaver/` on my drive)
3. Open terminal in local directory
4. Run `npm install` (may take a while)

### LIST B, CONCURRENT:
1. Get `environment.ts` file from a lab member (has Firebase config stuff)
2. Drop `environment.ts` into `/src/environments`, replacing existing file if need be

### Once Lists A and B are both complete:
1. Run `ng serve` in the terminal to serve AdaCAD locally. Should update with any changes in the code from here.
2. Pull any changes from remote regularly.
