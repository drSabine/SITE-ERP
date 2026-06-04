/**
 * Display label for a document's category. When the category is "Others",
 * show the submitter's free-text label instead of the generic name.
 */
export function categoryLabel(document) {
    if (document?.category?.code === 'OTHERS' && document.custom_category) {
        return document.custom_category;
    }

    return document?.category?.name ?? '-';
}
