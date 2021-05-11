import * as lodash from 'lodash'
import { URLExt } from '@jupyterlab/coreutils';

import { ServerConnection } from '@jupyterlab/services';

/**
 * Call the API extension
 *
 * @param endPoint API REST end point for the extension
 * @param init Initial values for the request
 * @returns The response body interpreted as JSON
 */
export async function requestAPI<T>(
  endPoint = '',
  init: RequestInit = {}
): Promise<T> {
  // Make request to Jupyter API
  const settings = ServerConnection.makeSettings();
  const requestUrl = URLExt.join(
    settings.baseUrl,
    'jlab_aiidatree', // API Namespace
    endPoint
  );

  let response: Response;
  try {
    response = await ServerConnection.makeRequest(requestUrl, init, settings);
  } catch (error) {
    throw new ServerConnection.NetworkError(error);
  }

  let data: any = await response.text();

  if (data.length > 0) {
    try {
      data = JSON.parse(data);
    } catch (error) {
      console.log('Not a JSON response body.', response);
    }
  }

  if (!response.ok) {
    throw new ServerConnection.ResponseError(response, data.message || data);
  }

  return data;
}

export interface Process {
  id: number,
  label: string | null,
  description: string | null,
  mtime: string,
  nodeType: string,
  processType: string,
  processLabel: string,
  processState: 'created' | 'running' | 'waiting' | 'finished' | 'excepted' | 'killed' | null,
  processStatus: string | null,
  exitStatus: number | null,
  schedulerState: string | null,
  paused: boolean | null,
  icon?: 'statusSucceeded' | 'statusKilled' | 'statusFailed' | 'statusCreated' | 'statusPaused' | 'statusUnknown' | 'statusWaiting' | 'statusRunning' | 'statusExcepted'
}

export async function queryProcesses(maxRecords: number = 1) {
    const dataToSend = { max_records: maxRecords };
    let reply: {rows: any[], fields: string[]}
    try {
      reply = await requestAPI<any>('processes', {
        body: JSON.stringify(dataToSend),
        method: 'POST'
      });
    } catch (reason) {
      console.error(
        `Error on POST /jlab_aiidatree/processes ${dataToSend}.\n${reason}`
      );
      // TODO deal with errors
    }
    const output = reply.rows.map(row => (lodash.zipObject(reply.fields, row) as unknown as Process))
    
    return output;
}

    // // GET request
    // try {
    //   const data = await requestAPI<any>('get_example');
    //   console.log(data);
    // } catch (reason) {
    //   console.error(`The jlab_aiidatree server extension appears to be missing.\n${reason}`);
    // }

    // POST request
    // const dataToSend = { max_records: 5 };
    // try {
    //   const reply = await requestAPI<any>('processes', {
    //     body: JSON.stringify(dataToSend),
    //     method: 'POST'
    //   });
    //   console.log(reply);
    // } catch (reason) {
    //   console.error(
    //     `Error on POST /jlab_aiidatree/processes ${dataToSend}.\n${reason}`
    //   );
    // }
