import { makeStyles } from '@material-ui/core/styles';

const drawerWidth = 250;

const useStyles = makeStyles((theme) => ({
  root: {
    display: 'flex',
  },
  title: {
    flexGrow: 1,
  },
  appBarHeader: {
    zIndex: theme.zIndex.drawer + 1,
  },
  footer: {
    textAlign: 'center'
  },
  drawer: {
    width: drawerWidth,
    flexShrink: 0,
  },
  drawerHeaderContainer: {
    textAlign: 'center',
  },
  drawerPaper: {
    width: drawerWidth,
  },
  drawerContainer: {
    overflow: 'auto',
  },
  content: {
    flexGrow: 1,
    padding: theme.spacing(1),
  },
  widgetContainer: {
    p: 4
  }
}));

export default useStyles;