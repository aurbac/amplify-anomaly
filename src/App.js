import React from 'react'
import { withAuthenticator } from '@aws-amplify/ui-react';
import { withStyles } from '@material-ui/core/styles';
import AppBar from '@material-ui/core/AppBar';
import Toolbar from '@material-ui/core/Toolbar';
import Typography from '@material-ui/core/Typography';
import Button from '@material-ui/core/Button';
import IconButton from '@material-ui/core/IconButton';
import PageviewIcon from '@material-ui/icons/Pageview';
import Paper from '@material-ui/core/Paper';
import Grid from '@material-ui/core/Grid';

import InputLabel from '@material-ui/core/InputLabel';
import MenuItem from '@material-ui/core/MenuItem';
import Select from '@material-ui/core/Select';

import FormControl from '@material-ui/core/FormControl';

import List from '@material-ui/core/List';
import ListItem from '@material-ui/core/ListItem';
import ListItemIcon from '@material-ui/core/ListItemIcon';
import ListItemText from '@material-ui/core/ListItemText';
import Chip from '@material-ui/core/Chip';
import { API } from 'aws-amplify';
import { Auth } from 'aws-amplify';

import Chart from "react-google-charts";

const useStyles = theme => ({
  root: {
    flexGrow: 1,
  },
  menuButton: {
    marginRight: theme.spacing(2),
  },
  title: {
    flexGrow: 1,
  },
  myContent: {
    padding: theme.spacing(2, 2, 2),
  },
  margin: {
    margin: theme.spacing(1),
  },
  extendedIcon: {
    marginRight: theme.spacing(1),
  },
  actionButtons: {
    '& > *': {
      margin: theme.spacing(1),
    },
  },
  paper: {
    padding: theme.spacing(2),
    textAlign: 'left',
    color: theme.palette.text.secondary,
  },
  formControl: {
    margin: theme.spacing(1),
    minWidth: "95%",
  },
});

class App extends React.Component {
  
  constructor(props){
    super(props);
    this.state = {
      detectors: [],
      anomalyDetectorArn: "",
      anomalies: [],
      anomalyGroupId: "",
      anomalySelected: {},
      timeSeriesList : [],
      TimestampList: [], 
      dataLine: [],
      dataChart: []
    };
  }
  
  async componentDidMount() {
      try {
        let apiName = 'MyApi';
        let path = 'list-detectors';
        let myInit = {
            headers: { Authorization: `Bearer ${(await Auth.currentSession()).getAccessToken().getJwtToken()}` }, 
            response: true,
        }
        API.get(apiName, path, myInit).then(response => {
            console.log(response);
            this.setState({ detectors: response.data });
        }).catch(error => {
            console.log(error);
        });
      } catch (err) { 
        console.log('error: ', err) 
      }
  }
  
  componentWillUnmount() {

  }
  
  onClickSignout = async event => {
    try {
        await Auth.signOut();
        window.location.reload(false);
    } catch (error) {
        console.log('error signing out: ', error);
    }
  }
  
  handleChangeDetectors = async event => {
    if (event.target.value==="")
      this.setState({ anomalies: [], anomalyGroupId: "", dataChart: [] })
    else{
      console.log(event.target.value);
      this.setState({ anomalyDetectorArn: event.target.value });
      try {
        let apiName = 'MyApi';
        let path = 'list-anomaly-group-summaries/'+event.target.value;
        let myInit = {
            headers: { Authorization: `Bearer ${(await Auth.currentSession()).getAccessToken().getJwtToken()}` }, 
            response: true,
        }
        API.get(apiName, path, myInit).then(response => {
            console.log(response);
            this.setState({ anomalies: response.data });
        }).catch(error => {
            console.log(error);
        });
      } catch (err) { 
        console.log('error: ', err) 
      }
      
      
    }
  };
  
  handleClickAnomaly = async item => {
    console.log(item);
    this.setState({ anomalySelected: item });
    try {
      let apiName = 'MyApi';
      let path = 'list-anomaly-group-time-series/'+this.state.anomalyDetectorArn+'/'+item.AnomalyGroupId+'/'+item.PrimaryMetricName;
      let myInit = {
          headers: { Authorization: `Bearer ${(await Auth.currentSession()).getAccessToken().getJwtToken()}` }, 
          response: true,
      }
      API.get(apiName, path, myInit).then(response => {
          let data_chart = [];
          let labels = [];
          labels.push("Date time");
          
          for (const [index_time, timeSeriesList] of response.data.TimeSeriesList.entries()) {
            labels.push(timeSeriesList.DimensionList[0].DimensionValue)
          }
          data_chart.push(labels);
          
          for (const [index, timeStamp] of response.data.TimestampList.entries()) {
            if (index>=response.data.TimestampList.length-25){
              let data_row = [];
              var mydate = new Date(timeStamp.substr(0,4), parseInt(timeStamp.substr(5,2))-1, timeStamp.substr(8,2), timeStamp.substr(11,2), timeStamp.substr(14,2));
              data_row.push(mydate);
              for (let i=0; i<response.data.TimeSeriesList.length; i++){
                data_row.push(response.data.TimeSeriesList[i].MetricValueList[index]);
              }
              data_chart.push(data_row);
            }
          }
          this.setState({ dataChart: data_chart });
      }).catch(error => {
          console.log(error);
      });
    } catch (err) { 
      console.log('error: ', err) 
    }
    
  }

  render() {
    const { classes } = this.props;
    
    return (
      <div className={classes.root}>
        <AppBar position="static">
          <Toolbar>
            <IconButton edge="start" className={classes.menuButton} color="inherit" aria-label="menu">
              <PageviewIcon />
            </IconButton>
            <Typography variant="h6" className={classes.title}>
              Anomalies - Amazon Lookout for Metrics (Preview)
            </Typography>
            <Button color="inherit" onClick={this.onClickSignout}>Sign out</Button>
          </Toolbar>
        </AppBar>
        
        <div className={classes.myContent}>
        
          <Grid container spacing={3}>

            <Grid item xs={12} md={4}>
              <Paper className={classes.paper}>
              
                <Typography gutterBottom variant="h6" component="h2">
                  Detectors
                </Typography>
                <FormControl variant="outlined" className={classes.formControl}>
                  <InputLabel id="demo-simple-select-outlined-label">Select a Detector</InputLabel>
                  <Select
                    labelId="demo-simple-select-outlined-label"
                    id="demo-simple-select-outlined"
                    label="Select a Detector"
                    value={this.state.AnomalyDetectorArn}
                    onChange={this.handleChangeDetectors}
                  >
                    <MenuItem value="">
                      <em>None</em>
                    </MenuItem>
                    { this.state.detectors.map(item => (
                      <MenuItem key={item.AnomalyDetectorArn} value={item.AnomalyDetectorArn}>{item.AnomalyDetectorName}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
                
                { this.state.anomalies.length>0 && (
                <Typography gutterBottom variant="h6" component="h2">
                  Anomalies
                </Typography>
                )}
                
                  <List component="nav" aria-label="main mailbox folders">
                    { this.state.anomalies.map(item => (
                      <ListItem key={item.AnomalyGroupId}
                        button onClick={() => this.handleClickAnomaly(item)} 
                      >
                        <ListItemIcon>
                          <Chip label={item.AnomalyGroupScore} size="small" />
                        </ListItemIcon>
                        <ListItemText primary={item.PrimaryMetricName} secondary={item.StartTime} />
                      </ListItem>
                    ))}
                  </List>
              
              </Paper>
            </Grid>
            <Grid item xs={12} md={8}>
              <Paper className={classes.paper}>
              
                { this.state.dataChart.length===0 ? (
                  <div>
                    <Typography gutterBottom variant="h4" component="h2">Amazon Lookout for Metrics</Typography>
                    <Typography variant="body1" gutterBottom>
                      Amazon Lookout for Metrics is a service that finds anomalies in your data, determines their root causes, and enables you to quickly take action. Built from the same technology used by Amazon.com, Amazon Lookout for Metrics reﬂects 20 years of expertise in anomaly detection and machine learning.
                    </Typography>
                    <Typography variant="body1" gutterBottom>
                      In Lookout for Metrics, you create detectors that monitor data to find anomalies. You configure the detector with a datasource and choose the values that it monitors (the dataset's measures). The detector can monitor all values of a measure overall, or use other data to sort measures into groups. For example, you can choose to monitor the availability of an application worldwide, or use a location field in your data as a dimension to monitor availability separately in each AWS Region or Availability Zone. Each combination of measure and dimension value is called a metric.
                    </Typography>
                  </div>
                ):(
                  <div>
                    <Typography gutterBottom variant="h4" component="h2">Anomaly: {this.state.anomalySelected.PrimaryMetricName}</Typography>
                    <Typography variant="subtitle1" gutterBottom><strong>Severity threshold: <Chip label={this.state.anomalySelected.AnomalyGroupScore} color="primary" /></strong></Typography>
                    <Typography variant="subtitle1" gutterBottom>
                      <strong>Start time:</strong> {this.state.anomalySelected.StartTime}
                    </Typography>
                    <Typography variant="subtitle1" gutterBottom>
                      <strong>End time:</strong> {this.state.anomalySelected.EndTime}
                    </Typography>
                    
                    <Chart
                      width={'100%'}
                      height={'500px'}
                      chartType="Line"
                      loader={<div>Loading Chart</div>}
                      data={this.state.dataChart}
                      options={{
                        hAxis: {
                          title: 'Date Time',
                        },
                        series: {
                          1: { curveType: 'none' },
                        },
                      }}
                      rootProps={{ 'data-testid': '2' }}
                    />
                  </div>
                )}

              </Paper>
            </Grid>

          </Grid>

        </div>
        
      </div>
    );
  }
}

export default withAuthenticator(withStyles(useStyles)(App));
