import { useState } from 'react';
import type { ContentBlock } from '../lib/types';
import { describeSchema } from '../lib/schema';
import { ContractView } from './ContractView';
import * as s from '../styles/viewer.css';

function ContentImage({
  block,
}: {
  block: Extract<ContentBlock, { type: 'image' }>;
}) {
  const [failed, setFailed] = useState(false);
  const allowed =
    /^(https?:\/\/|\/[^/]|\.\.?\/|data:image\/(png|jpeg|webp|gif);base64,)/i.test(
      block.src,
    );
  if (!allowed || failed)
    return (
      <p role="status" className={s.bad}>
        Image could not be loaded.
      </p>
    );
  return (
    <img
      className={s.image}
      src={block.src}
      alt={block.alt}
      loading="lazy"
      onError={() => setFailed(true)}
    />
  );
}

/** Render declarative blocks as escaped React content, never executable markup. */
export function ContentBlocks({
  blocks,
  compact = false,
}: {
  blocks: ContentBlock[];
  compact?: boolean;
}) {
  return (
    <div className={s.blockStack}>
      {blocks.map((block, index) => {
        let content;
        switch (block.type) {
          case 'text':
            content = <p className={s.textBlock}>{block.text}</p>;
            break;
          case 'json':
            content = (
              <pre className={s.code}>
                {JSON.stringify(block.value, null, 2)}
              </pre>
            );
            break;
          case 'image':
            content = <ContentImage block={block} />;
            break;
          case 'schema': {
            const result = describeSchema(block.schema, 'output');
            content =
              result.status === 'success' ? (
                <ContractView schema={result.schema} compact={compact} />
              ) : (
                <p className={s.warning}>{result.message}</p>
              );
            break;
          }
          case 'table':
            content = (
              <div className={s.tableWrap}>
                <table className={s.table}>
                  <thead>
                    <tr>
                      {block.columns.map((column, columnIndex) => (
                        <th key={columnIndex} scope="col">
                          {column}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {block.rows.map((row, rowIndex) => (
                      <tr key={rowIndex}>
                        {row.map((value, cellIndex) => (
                          <td key={cellIndex}>
                            {typeof value === 'string'
                              ? value
                              : JSON.stringify(value)}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            );
            break;
        }
        return (
          <div key={index}>
            {block.title && <div className={s.contentTitle}>{block.title}</div>}
            {content}
          </div>
        );
      })}
    </div>
  );
}
