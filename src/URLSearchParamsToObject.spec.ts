import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { URLSearchParamsToObject } from './URLSearchParamsToObject.js'

void describe('URLSearchParamsToObject()', () => {
	void it('should convert URLSearchParams to a plain object', () =>
		assert.deepEqual(
			URLSearchParamsToObject(
				new URLSearchParams(
					'eci=73393515&tac=132&requestType=custom&mcc=397&mnc=73&customTypes=2',
				),
			),
			{
				eci: '73393515',
				tac: '132',
				requestType: 'custom',
				mcc: '397',
				mnc: '73',
				customTypes: '2',
			},
		))
})
