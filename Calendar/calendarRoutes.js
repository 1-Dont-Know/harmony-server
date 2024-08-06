const express = require('express');
const fs = require('fs').promises;
const path = require('path');
const bodyParser = require('body-parser');
const {
    loadSavedCredentialsIfExist,
    saveCredentials,
    authorize,
    createCalendar,
    listCalendars,
    getCalendarIdByName,
    getEventIdByName,
    listEvents,
    listEventsByDate,
    createEvent,
    editEvent,
    deleteEvent
} = require('./index.js');

async function errorHandlingMiddleware(error, req, res, next) {
    if (error && error.message === 'invalid_grant') {
        console.log('(JOSH) Error:', error.message);
      const expiredTokenPath = path.join(process.cwd(), './Calendar/token.json');
      try {
        await fs.unlink(expiredTokenPath);
        console.log(`Deleted file at path: ${expiredTokenPath}`);
      } catch (error) {
        console.error(`Failed to delete file at path: ${filePath}`, error);
      }
    }
    res.status(Number(error.code)).json({ error: 'Token was expired. Please try again to trigger a new login attempt.'});
    next(error);
  }

const router = express.Router();
router.use(bodyParser.json());


router.get('/listcalendars', async (req, res, next) => {
    try {
        const calendars = await listCalendars();
        console.log('/listcalendars accessed');
        res.json(calendars);
    } catch (error) {
        // res.status(Number(error.code)).json({ error: error.message });
        // console.log('This is my log:', error );
        next(error)
    }
});



router.get('/createcalendar', async (req, res) => {
    try {
        // console.log(req.query.groupName);
        await createCalendar(req.query.groupName);
        console.log('/addcalendar accessed:', req.query.groupName);
        res.json({message: `calendar created successfully in`});
    } catch (error) {
        res.status(Number(error.code)).json({ error: error.message });
    }
})

router.get('/getcalendarid/:calendarName', async (req, res) => {
    try {
        const id = await getCalendarIdByName(req.params.calendarName);
        console.log('/getcalendarid accessed');
        res.json(id);
    } catch (error) {
        res.status(Number(error.code)).json({ error: error.message });
    }
});

router.get('/geteventid/:calendarName/:eventName', async (req, res) => {
    try {
        const id = await getEventIdByName(req.params.calendarName, req.params.eventName);
        console.log('/geteventid accessed');
        res.json(id);
    } catch (error) {
        res.status(Number(error.code)).json({ error: error.message });
    }
});

router.get('/listevents/:calendarName', async (req, res) => {
    try {
        let events;
        if (req.query.date) {
            const date = req.query.date;
            events = await listEventsByDate(req.params.calendarName, date);
        } else {
            events = await listEvents(req.params.calendarName);
        }
        console.log('/listevents accessed');
        res.json(events);
    } catch (error) {
        res.status(Number(error.code)).json({ error: error.message });
    }
});

router.post('/createevent', async (req, res) => {
    try {
        await createEvent(req.body.calendar, req.body.event );
        console.log('/createevent accessed:', req.body.calendar, req.body.event);
        res.json({message: `event created successfully in '${req.body.calendar}'`, event: req.body.event});
    } catch (error) {
        res.status(Number(error.code)).json({ error: error.message });
    }
})

router.put('/editevent', async (req, res) => {
    try {
        await editEvent(req.body.calendar, req.body.eventName, req.body.newEvent );
        console.log('/editevent accessed');
        res.json({message: `event edited successfully in '${req.body.calendar}'`, newEvent: req.body.newEvent});
    } catch (error) {
        res.status(Number(error.code)).json({ error: error.message });
    }
})

router.delete('/deleteevent', async (req, res) => {
    console.log('/deleteevent accessed');
    console.log(req.body);
    try {
        await deleteEvent(req.body.calendar, req.body.eventName);
        res.json({message: `event deleted successfully from '${req.body.calendar}'`});
    } catch (error) {
        res.status(Number(error.code)).json({ error: error.message });
    }
})

router.use(errorHandlingMiddleware);

module.exports = router;
