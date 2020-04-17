import React from 'react';
import Container from '@material-ui/core/Container';
import Box from '@material-ui/core/Box';
import Copyright from './copyright.js';

function Footer() {
  return (
    <React.Fragment>      
      <Container maxWidth="md" component="footer">
        <Box mt={5}>
          These works are solely my own and not necessarily those of my employer.
          <Copyright />
        </Box>
      </Container>
    </React.Fragment>
  );
}

export default Footer; 