# Notes while developing pedals interface for AdaCAD

Author(s): S

Any directory paths assume that `/` is the root of the local AdaCAD repository.

# 3/11/22
Adding DraftPlayer into a new `Player` component underneath `mixer`.
Icon refs: https://fontawesome.com/search?q=play&m=free&s=solid%2Cregular%2Cbrands (which I used for the "play" button icon);

## Routing from SubDraft Component to Player  

1. Added "play" button in `[FILE] subdraft.component.html`
2. Added event emitter `onDraftToPlayer` in `[FILE] subdraft.component.ts`
3. Added function `sendDraftToPlayer()` that is called on `(click)`. Tells event emitter to emit the draft of the subdraft component (`this._draft: Draft`)
4. The `palette` component is the parent component of the subdraft, so it receives the event. Added an event emitter also called `onDraftToPlayer` in `[FILE] palette.component.ts` that passes on the `Draft` object.
5. Added method to handle the event, `this.subdraftToPlayer()`
6. Added subscription to this event in `setSubdraftSubscriptions` method in `[FILE] palette.component.ts`
7. The `mixer` component is the parent of `palette`. Added a new property `playerSubscription` to `[FILE] mixer.component.ts` with type `Subscription`.
8. Added method `this.draftToPlayer()` to handle the palette event, setting the active draft of `player` to the draft that has been passed up from the subdraft component. The method also tells `player` to draw the draft.
9. Added line in `ngAfterViewInit()` that assigns the subscription for the palette event to the handler method.


# notes from 2/28/22 meeting w/ Emma
Workflow for AdaCAD ML
1. Locally trained the model, saved model weights (output of training) to JSON -- still not in AdaCAD repo
2. add JSON to AdaCAD assets folder in repo
3. Service that uses model weights to predict
    - generates draft for VAE (style transfer)
    - classifier returns number
4. Putting on interface? Laura did it

# notes from 2/23/22 meeting w/ Laura
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
