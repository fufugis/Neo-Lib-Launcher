# Rearranging Home widgets

## Content size versus box size

Home → **Edit widgets** contains all widget controls: rearrangement, snap/free placement, selection and hidden-widget recovery, import and content settings. Privacy locking and date filters stay separate on Home.

Inside **Edit widgets**, the **Content size** slider (100–180%) controls the shared size. Choose an individual widget in **Apply to** to give it a separate override, or choose **Use shared size** to remove that override. **Reset all content sizes** restores 100% without changing placement, filters, hidden widgets or permissions. Changes save automatically.

Content size enlarges text, artwork and controls inside the existing width/height; the inner layout reflows and scrolls rather than shrinking the outer card. Titlebars and editor handles retain their normal sizes. Lounge keeps its independent widget zoom.

The playtime pie's **Filters** panel has a **Chart size** slider (100–600px) and **Show legend** toggle, saved independently for Home and Lounge. Large charts remain constrained by their widget width. **Reset filters** keeps chart size and legend preference. To enlarge the containing box instead, use the arrangement editor below.

## Arrangement editor

Choose **Edit widgets → Rearrange widgets** on Home. A bordered, zoomed-out Home canvas shows your visible widgets as named boxes, without their busy content.

- Drag a box to move it. Overlap is allowed; the most recently dragged box goes on top.
- Use the **Widget** picker to bring a covered box to the front and focus it for keyboard adjustments.
- **Snap on** aligns moves and sizes to a 24px grid. Choose **Free placement** for pixel-level positioning.
- Drag a box's bottom-right corner to resize it. Tab focuses controls; arrow keys move a focused box or adjust its focused resize corner. Shift increases movement steps.
- **Zoom** and **Fit Home** only change the editor's view. They do not shrink the saved widget content.
- **Reset draft** returns to the arrangement you opened, without saving anything.
- **Save layout** saves your positions, sizes and stacking order, then closes the editor. **Cancel** or Escape discards the draft.

Opening the editor captures the current arrangement, whether it uses the older automatic grid or free placement. Saving uses exact free-canvas coordinates, even when editor snapping is on, so automatic grid flow cannot undo the chosen positions. The normal Home grid/free switch remains available for returning to automatic alignment. Hidden widgets, community-widget configuration and per-widget filters are preserved. Lounge imports are not rearranged by this editor.

Large Home layouts can be scrolled inside the editor. Positions stay within the displayed Home canvas; widgets cannot be dragged outside its border. Saved pixel layouts are not a new responsive-grid engine: smaller windows may need Home scrolling or a fresh arrangement.
## Temporary holding area and page height

In Rearrange widgets, drag named boxes into the dashed holding area to the right of Home while sorting. Drag them back when ready. The Widget picker and Park selected / Return selected controls provide a keyboard/controller alternative and recover overlapped boxes. Parking preserves widget dimensions and original Home positions; it is never a hidden-widget setting or a saved off-screen location. Return every parked box before Save. Cancel/Escape and Reset draft clear the temporary arrangement without hiding widgets.

Home height accepts a pixel value or +500px space increments. It cannot shrink below occupied widget edges. Saving preserves extra empty space when reopening Home/the editor. Normal Home scrolls to the full saved page rather than compressing it to the window height. Zoom does not change actual widget dimensions; edge scrolling during drag accounts for both scroll offset and zoom. The shared game-preview editor does not gain Home's temporary area or height controls.
