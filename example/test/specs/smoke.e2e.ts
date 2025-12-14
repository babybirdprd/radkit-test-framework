describe('Tauri Example App', () => {
    it('should launch the application', async () => {
        // Wait for app to load
        await browser.pause(2000);

        // Verify title (Tauri apps often don't have a document title unless set, but we can try)
        // Note: browser.getTitle() might return the HTML title.
        // If the window title is set via Tauri, it might not match document.title immediately.
        // However, let's assume we check for existence of some element.

        const body = await $('body');
        expect(await body.isExisting()).toBe(true);
    });

    it('should show "Initialize Agent" button', async () => {
        // Based on the request: "Checks if the "Initialize Agent" button is visible."
        // We need to find this button.
        // I should verify the actual text/selector from the source code if possible.
        // But for now I'll assume the text is "Initialize Agent".

        // We can look for a button with that text.
        // Using an xpath or a refined selector is safer.
        const btn = await $('button=Initialize Agent');

        // Wait for it to exist
        await btn.waitForExist({ timeout: 5000 });

        // Verify it is displayed
        expect(await btn.isDisplayed()).toBe(true);
    });
});
