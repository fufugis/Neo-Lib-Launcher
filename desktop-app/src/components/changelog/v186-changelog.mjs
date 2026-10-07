import { V185_CHANGELOG } from './v185-changelog.mjs';

export const V186_CHANGELOG = {
  version: '1.8.6',
  title: 'Windows release recovery and all v1.8.5 improvements',
  major: [
    { title: 'Corrected Windows release checks', body: 'Windows short temporary-path aliases and CRLF line endings no longer incorrectly fail release verification. The published v1.8.5 tag is preserved; this patch includes its features and the corrected build checks.' },
    ...V185_CHANGELOG.major,
  ],
};
