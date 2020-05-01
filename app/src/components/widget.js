import React from 'react';
import { view } from '@risingstack/react-easy-state';
import 'cross-fetch/polyfill';
import Container from '@material-ui/core/Container';
import Paper from '@material-ui/core/Paper';
import Box from '@material-ui/core/Box';

const Widget = view(({ children }) => {
  return (
    <Container>
      <Paper elevation={3}>
        <Box p={2} m={1}>
          {children}
        </Box>
      </Paper>
    </Container>
  );
});

export default Widget; 