import { useState } from 'react';
import './styles/App.css';
import TextareaAutosize from 'react-textarea-autosize';
import { SpeechConfig, SpeechTranslationConfig, ResultReason, AudioConfig, TranslationRecognizer, SpeechSynthesizer } from 'microsoft-cognitiveservices-speech-sdk';
import Select from 'react-select';
import { v4 as uuidv4 } from 'uuid';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import KeyboardVoiceIcon from '@mui/icons-material/KeyboardVoice';
import VolumeUpIcon from '@mui/icons-material/VolumeUp';
import Button from '@mui/material/Button';
import ClearIcon from '@mui/icons-material/Clear';

const axios = require('axios').default;

const subscriptionKey = "512e3f9068564be1aab8406941bf7bc4";
const apiKey = "79bd9314d70a46f5b8fbde4d2fcc47cb"
const endpoint = "https://api.cognitive.microsofttranslator.com";
const location = "westeurope";

const speechConfig = SpeechConfig.fromSubscription(apiKey, location);
const speechTranslationConfig = SpeechTranslationConfig.fromSubscription(apiKey, location);

function App() {

  const options = [
    { value: 'ar-EG', label: 'Arabic' },
    { value: 'zh-Hans', label: 'Chinese - Simplified' },
    { value: 'en-US', label: 'English' },
    { value: 'fi-FI', label: 'Finnish' },
    { value: 'fr-FR', label: 'French' },
    { value: 'de-DE', label: 'German' },
    { value: 'hi-IN', label: 'Hindi' },
    { value: 'it-IT', label: 'Italian' },
    { value: 'ja-JP', label: 'Japanese' },
    { value: 'ko-KR', label: 'Korean' },
    { value: 'pl-PL', label: 'Polish' },
    { value: 'pt-BR', label: 'Portuguese' },
    { value: 'ru-RU', label: 'Russian' },
    { value: 'es-ES', label: 'Spanish' },
    { value: 'sv-SE', label: 'Swedish' },
  ];

  const [langFrom, setLangFrom] = useState('pl-PL')
  const [langTo, setLangTo] = useState('en-US')
  const [translation, setTranslation] = useState('')
  const [text, setText] = useState('')

  const saveText = (event: any) => {
    setText(event.target.value)
  }

  const handleChangeFrom = (selectedOption: any) => setLangFrom(selectedOption.value);

  const handleChangeTo = (selectedOption: any) => {
    setLangTo(selectedOption.value);
    translate(selectedOption.value);
  }

  const listen = () => {
    speechTranslationConfig.speechRecognitionLanguage = langFrom;
    speechConfig.speechRecognitionLanguage = langFrom;
    speechTranslationConfig.addTargetLanguage(langTo)

    const audioConfig = AudioConfig.fromDefaultMicrophoneInput();
    const recognizer = new TranslationRecognizer(speechTranslationConfig, audioConfig);

    setText('')

    recognizer.recognizeOnceAsync((result: any) => {
      if (result.reason === ResultReason.TranslatedSpeech) {
        setText(`${result.text}`)
        setTranslation(result.translations.get(langTo.split('-')[0]))
      } else {
        alert('ERROR: Speech was cancelled or could not be recognized. Ensure your microphone is working properly.');
      }
    });
  }

  const speak = (textToSpeak: string, lang: string) => {
    speechConfig.speechSynthesisLanguage = lang
    const audioConfig = AudioConfig.fromDefaultSpeakerOutput();
    const synthesizer = new SpeechSynthesizer(speechConfig, audioConfig);

    synthesizer.speakTextAsync(
      textToSpeak,
      (result: any) => {
        synthesizer.close();
      },
      (error: any) => {
        alert(error);
        synthesizer.close();
      });
  }

  const translate = (langTo: string) => {
    axios({
      baseURL: endpoint,
      url: '/translate',
      method: 'post',
      headers: {
        'Ocp-Apim-Subscription-Key': subscriptionKey,
        'Ocp-Apim-Subscription-Region': location,
        'Content-type': 'application/json',
        'X-ClientTraceId': uuidv4().toString()
      },
      params: {
        'api-version': '3.0',
        'from': langFrom,
        'to': langTo
      },
      data: [{
        'text': text
      }],
      responseType: 'json'
    }).then((response: any) => setTranslation(response.data[0].translations[0].text))
  }

  const handleEnter = (event : any) => {
    if(event.key === 'Enter'){
      translate(langTo)
    }
  }
  return (
    <div className="App">
      <h1>Translator</h1>
      <div className='translatorsBox'>
        <div className='fromBox'>
          <Select isSearchable defaultValue={{ value: 'pl-PL', label: 'Polish' }} onChange={handleChangeFrom} options={options} />
          <TextareaAutosize onKeyPress={(event) => handleEnter(event)} onChange={(event) => { saveText(event); setTranslation('') }} className='from' value={text} />
          <div className='fromActions'>
            <Tooltip title="Translate speech">
              <IconButton onClick={() => listen()}>
                <KeyboardVoiceIcon fontSize="large" />
              </IconButton>
            </Tooltip>
            <Tooltip title="Listen">
              <IconButton onClick={() => text ? speak(text, langFrom) : ""}>
                <VolumeUpIcon fontSize="large" color={!text ? "disabled" : "action"} />
              </IconButton>
            </Tooltip>
            <Tooltip title="Copy">
              <IconButton onClick={() => text ? navigator.clipboard.writeText(text) : ""}>
                <ContentCopyIcon fontSize="large" color={!text ? "disabled" : "action"} />
              </IconButton>
            </Tooltip>
            <Tooltip title="Clear">
              <IconButton onClick={() => text ? (setText(''),setTranslation('')) : ""}>
                <ClearIcon fontSize="large" color={!text ? "disabled" : "action"} />
              </IconButton>
            </Tooltip>
          </div>
        </div>
        <div className='toBox'>
          <Select isSearchable defaultValue={{ value: 'en-US', label: 'English' }} onChange={handleChangeTo} options={options} />
          <TextareaAutosize readOnly className='to' value={translation} />
          <div className='toActions'>
            <Tooltip title="Listen">
              <IconButton onClick={() => translation ? speak(translation, langTo) : ""}>
                <VolumeUpIcon fontSize="large" color={!translation ? "disabled" : "action"} />
              </IconButton>
            </Tooltip>
            <Tooltip title="Copy">
              <IconButton onClick={() => translation ? navigator.clipboard.writeText(translation) : ""}>
                <ContentCopyIcon fontSize="large" color={!translation ? "disabled" : "action"} />
              </IconButton>
            </Tooltip>
          </div>
        </div>
        <br />
        <Button style={{margin: '20px'}} variant="contained" color="primary" disabled={!text} onClick={() => translate(langTo)}>Translate</Button>
      </div>
    </div >
  );
}

export default App;
