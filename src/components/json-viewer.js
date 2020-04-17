import React from 'react';
import ReactJson from 'react-json-view';
import { view } from '@risingstack/react-easy-state';

const JsonViewer = view(({ jsonObject, collapseStringsAfterLength }) => {

  const customStyle = {
    'textAlign': 'left',
  };

  return (
    <ReactJson
      theme='twilight'
      collapseStringsAfterLength={collapseStringsAfterLength || 30 }
      collapsed={1}
      style={customStyle}
      src={jsonObject}
      />
  );

});

export default JsonViewer; 