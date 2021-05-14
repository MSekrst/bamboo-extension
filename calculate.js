// When the button is clicked, inject into current page
document.addEventListener('click', async () => {
  let [tab] = await chrome.tabs.query({ active: true, currentWindow: true })

  chrome.scripting.executeScript({
    target: { tabId: tab.id },
    function: calculateHours,
  })
})

function calculateHours() {
  /**
   * Checks if string is a number.
   */
  function isNumber(value) {
    return /^-?\d+$/.test(value)
  }

  const timeSheetForm = document.querySelector('.js-timesheet-content form')

  if (!timeSheetForm) {
    alert('Must be on the timesheet page on BambooHR')
    return
  }

  const monthNoWeekendRows = timeSheetForm.querySelectorAll(
    '.TimesheetSlat:not(.js-timesheet-showWeekends):not(.TimesheetSlat--disabled)'
  )

  const workDays = [] // previous work days + today
  const futureDays = [] // future work days
  const vacationDays = [] // vacation days used or scheduled
  const holidays = [] // holidays
  const medicalCheckup = [] // medical checkup

  const VACATION_ICON = '#fab-calendar-clock-14x14'
  const HOLIDAY_ICON = '#fab-fireworks-16x16'
  const MEDICAL_CHECKUP_ICON = '#fab-medical-clipboard-11x14'

  const infoIconQuery = '.TimesheetSlat__extraInfoItem svg use'

  monthNoWeekendRows.forEach(element => {
    const vacationIcon = element.querySelector(infoIconQuery)
    const holidayIcon = element.querySelector(infoIconQuery)
    const medicalIcon = element.querySelector(infoIconQuery)

    const iconAttributeName = 'xlink:href'

    if (holidayIcon && holidayIcon.getAttribute(iconAttributeName) === HOLIDAY_ICON) {
      holidays.push(element)
    } else if (vacationIcon && vacationIcon.getAttribute(iconAttributeName) === VACATION_ICON) {
      vacationDays.push(element)
    } else if (medicalIcon && medicalIcon.getAttribute(iconAttributeName) === MEDICAL_CHECKUP_ICON) {
      medicalCheckup.push(element)
    } else {
      const isFutureDay = element.getAttribute('class').includes('TimesheetSlat--future')

      if (isFutureDay) {
        futureDays.push(element)
      } else {
        workDays.push(element)
      }
    }
  })

  let hoursWorked = 0

  const timeInputQuery = 'input.TimesheetSlat__input'

  workDays.forEach(element => {
    const inputElement = element.querySelector(timeInputQuery)

    if (inputElement) {
      const value = inputElement.getAttribute('value')

      if (value) {
        if (isNumber(value)) {
          hoursWorked += value
        }

        const splitted = value.split(' ')

        if (splitted[0]) {
          const stringValue = splitted[0]

          if (isNumber(stringValue)) {
            hoursWorked += Number(stringValue)
          } else {
            const strippedValue = stringValue.substr(0, stringValue.length - 1)

            hoursWorked += Number(strippedValue)
          }
        }

        if (splitted[1]) {
          const stringValue = splitted[1]

          if (isNumber(stringValue)) {
            hoursWorked += Number(stringValue) / 60
          } else {
            const strippedValue = stringValue.substr(0, stringValue.length - 1)

            hoursWorked += Number(strippedValue) / 60
          }
        }
      }
    }
  })

  const monthWorkDays = workDays.length + futureDays.length + vacationDays.length + medicalCheckup.length
  const monthWorkHours = monthWorkDays * 8
  const availableHours = workDays.length * 8

  const timeDiff = hoursWorked - availableHours

  const ID = 'custom-diff'

  const content = `
    <div class="TimesheetSummary__title TimesheetSummary__title--payPeriod">Difference this month</div>
    <div style="font-size: 22px; font-weight: 700;color: ${timeDiff > 0 ? '#527a00' : 'red'};">${timeDiff}</div>
    <div style="margin-top: 8px;" class="TimesheetSummary__title TimesheetSummary__title--payPeriod">Working days this month</div>
    <div class="TimesheetSummary__text">${monthWorkDays} days (${monthWorkHours}h)</div>
   `

  const previousContainer = document.getElementById(ID)

  if (previousContainer) {
    previousContainer.innerHTML = content
  } else {
    const container = document.querySelector('.TimesheetSummary')

    if (container) {
      const markup = `<div id="${ID}" style="padding: 8px;">
        ${content}
      <div>`

      container.innerHTML += markup
    }
  }
}
