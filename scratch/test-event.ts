// import axios from 'axios';
import * as axios from 'axios';
const { isAxiosError } = axios;

async function testCreateEvent() {
  try {
    const response = await axios.post('http://localhost:8000/events', {
      name: 'Test Event',
      picId: 1, // Make sure user ID 1 exists
      startDate: '2024-04-14',
      endDate: '2024-04-15'
    });
    console.log('Success:', response.data);
  } catch (error) {
    if (isAxiosError(error)) {
      if (error.response) {
        console.log('Status:', error.response.status);
        console.log('Data:', error.response.data);
      } else {
        console.log('Error:', error.message);
      }
    } else {
      console.log('Error:', error instanceof Error ? error.message : String(error));
    }
  }
}

testCreateEvent();
