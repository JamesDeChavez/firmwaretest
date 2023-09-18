// Functions
const getFirmwareInfo = async (model) => {
    const url = `https://firmware.ptzoptics.com/${model}/RVU.json`
    try {
        const response = await fetch(url)
        const { data } = await response.json()
        return data
    } catch (error) {
        console.log(error)
        return error
    }
}

const getCurrentVersion = async () => {
    const path = `/cgi-bin/param.cgi?f=get_device_conf`
    try {
        const response = await fetch(path)
        const data = await response.text()
        const startIdx = data.indexOf('SOC v') + 4
        const endIdx = data.slice(startIdx).indexOf('-') + startIdx
        return data.slice(startIdx, endIdx).trim()
    } catch (error) {
        console.log(error)
        return error
    }
}

const checkIfUpdatedNeeded =  async (model) => {
    try {
        const firmwareInfo = await getFirmwareInfo(model)
        const latestVersion = firmwareInfo.soc_version
        const currentVersion = await getCurrentVersion()
        return {
            updateNeeded: latestVersion !== currentVersion,
            latestVersion,
            currentVersion
        }
    } catch (error) {
        console.log(error)
        return error
    }
}

const getFirmware = async (model) => {
    try {
        const firmwareInfo = await getFirmwareInfo(model)
        const firmwareFileName = firmwareInfo.img_name
        const url = `https://firmware.ptzoptics.com/${model}/${firmwareFileName}`
        const firmware = await fetch(url)
        const blob = await firmware.blob()
        const fileURL = URL.createObjectURL(blob)
        const aElement = document.createElement('a')
        aElement.href = fileURL
        aElement.download =  `${model}_firmware.img`      
        aElement.setAttribute('target', '_blank')
        aElement.click()
        URL.revokeObjectURL(fileURL)
        return 'success'
    } catch (error) {
        console.log(error)
        return error
    }
}

const getLogFile = async (model) => {
    try {
        const firmwareInfo = await getFirmwareInfo(model)
        const logFileName = firmwareInfo.log_name
        const url = `https://firmware.ptzoptics.com/${model}/${logFileName}`
        const log = await fetch(url)
        const blob = await log.blob()
        const fileURL = URL.createObjectURL(blob)
        const aElement = document.createElement('a')
        aElement.href = fileURL
        aElement.download =  `${model}_logfile.log`      
        aElement.setAttribute('target', '_blank')
        aElement.click()
        URL.revokeObjectURL(fileURL)
        return 'success'
    } catch (error) {
        console.log(error)
        return error
    }
}

const commenceUpdate = async () => {
    try {
        const response = await fetch('/update')
        const data = await response.text()
        return data
    } catch (error) {
        console.log(error)
        return error
    }
}

// Selectors
const checkForUpdatesForm = document.getElementById('checkforupdate-form')
const checkResultsForm = document.getElementById('checkresults-form')
const uploadForm = document.getElementById('upload-form')
const startUpdateForm = document.getElementById('startupdate-form')
const currentVersionText = document.getElementById('currentVersion')
const latestVersionText = document.getElementById('latestVersion')
const versionResultText = document.getElementById('versionsResultText')
const uploadResultText = document.getElementById('uploadResultText')
const startUpdateButton = document.getElementById('startupdate-button')
const progressContainer = document.getElementById('progressContainer')
const updateSuccessContainer = document.getElementById('updateSuccessContainer')
const updateSuccessText = document.getElementById('updateSuccessText')

// Event Listeners
checkForUpdatesForm.addEventListener('submit', async (event) => {
    event.preventDefault()
    const model = 'F53.HI'
    checkForUpdatesForm.querySelector('svg').classList.toggle('hide')
    const button = checkForUpdatesForm.querySelector('.formButton')
    button.disabled = true
    try {
        const {updateNeeded, latestVersion, currentVersion} = await checkIfUpdatedNeeded(model)
        if (updateNeeded) {
            currentVersionText.innerText = currentVersion
            latestVersionText.innerText = latestVersion
            versionResultText.innerText = 'Your firmware is out of date'
            checkForUpdatesForm.classList.toggle('hide')
            checkResultsForm.classList.toggle('hide')
        }
    }
     catch (error) {
        console.log(error)
    }
})

checkResultsForm.addEventListener('submit', async (event) => {
    event.preventDefault()
    const model = 'F53.HI'
    checkResultsForm.querySelector('svg').classList.toggle('hide')
    const button = checkResultsForm.querySelector('.formButton')
    button.disabled = true
    try {
        const firmwareResult = await getFirmware(model)
        const logResult = await getLogFile(model)
        if (firmwareResult === 'success' && logResult === 'success') {            
            checkResultsForm.classList.toggle('hide')
            uploadForm.classList.toggle('hide')
        }
    }
     catch (error) {
        console.log(error)
    }
})

uploadForm.addEventListener('submit', async (event) => {
    event.preventDefault()
    uploadForm.querySelector('svg').classList.toggle('hide')
    const button = uploadForm.querySelector('.formButton')
    button.disabled = true
    const formData = new FormData(uploadForm)
    if (formData.get('file') === '') {
        return
    }
    try {
        const response = await fetch('/', {
            method: 'POST',
            body: formData
        })
        const json = await response.json()
        if (JSON.stringify(json) === '"Firmware successfully uploaded"') {
            uploadResultText.innerText = JSON.stringify(json).replace(/['"]+/g, '')
            uploadForm.classList.toggle('hide')
            startUpdateForm.classList.toggle('hide')
        }
    }
     catch (error) {
        console.log(error)
    }
})

startUpdateForm.addEventListener('submit', async (event) => {
    event.preventDefault()
    const button = startUpdateForm.querySelector('.formButton')
    button.disabled = true
    try {
        progressContainer.classList.toggle('hide')
        const result = await commenceUpdate()
        if (result === '"Camera successfully updated"') {
            updateSuccessText.innerHTML = result.replace(/['"]+/g, '')
            progressContainer.classList.toggle('hide')
            updateSuccessContainer.classList.toggle('hide')
        }
    } catch (error) {
        console.log(error)
    }
})