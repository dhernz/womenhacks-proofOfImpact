import { TezosToolkit } from "@taquito/taquito";
import {
  NetworkType,
} from "@airgap/beacon-sdk";
import config from '../config';



export const connectWallet = ({wallet, Tezos}) => {
    return async (dispatch)=>{
        try {
            var payload = {};

            Tezos.setWalletProvider(wallet)

            const activeAccount = await wallet.client.getActiveAccount();
            if(!activeAccount){
                await wallet.requestPermissions({
                network: {
                    type: NetworkType.GHOSTNET,
                    rpcUrl: "https://ghostnet.smartpy.io"
                }
                });
            }
            const userAddress = await wallet.getPKH();
            const balance = await Tezos.tz.getBalance(userAddress);

            payload.user = {
                userAddress : userAddress,
                balance : balance.toNumber()
            }
            dispatch(_walletConfig(payload.user));

          } catch (error) {
              console.log(error);
              dispatch({
                  type: "CONNECT_WALLET_ERROR",
              })  
        }
    }
}

export const _walletConfig = (user) => {
    return {
        type:"CONNECT_WALLET",
        user,
    }
}

export const disconnectWallet = ({wallet, setTezos}) => {
    return async (dispatch) => {

        setTezos(new TezosToolkit("https://ghostnet.smartpy.io"));

        dispatch({
            type:"DISCONNECT_WALLET",
        });

        if(wallet){
            await wallet.client.removeAllAccounts();
            await wallet.client.removeAllPeers();
            await wallet.client.destroy();
        }
      };
}
export const fetchContractData = ({Tezos}) => {
    return async (dispatch, getState) => {
        try {
            const contract = await Tezos.wallet.at(config.contractAddress);

            const storage = await contract.storage();
            dispatch({type:"SET_VALUE", payload: storage.toNumber()});
        }catch(e){
            //dispatch
            console.log(e);
        }
    }
}

export const incrementData = ({Tezos}) => {
    return async (dispatch, getState) => {
        try{
            const contract = await Tezos.wallet.at(config.contractAddress);

            const op = await contract.methods.increment(1).send();
            await op.confirmation();
            const newStorage = await contract.storage();
            dispatch({type:"SET_VALUE", payload: newStorage.toNumber()});
        }catch(e){
            console.log(e);
        }
    }
}


export const decrementData = ({Tezos}) => {
    return async (dispatch, getState) => {
        try{
            const contract = await Tezos.wallet.at(config.contractAddress);

            const op = await contract.methods.decrement(1).send();
            await op.confirmation();
            const newStorage = await contract.storage();
            dispatch({type:"SET_VALUE", payload: newStorage.toNumber()});
        }catch(e){
            console.log(e);
        }
    }
}


export const mintNFT = ({ Tezos, amount, metadata }) => {
	return async (dispatch) => {
		try {
			const contract = await Tezos.wallet.at(config.contractAddress);
			let bytes = "";
			for (var i = 0; i < metadata.length; i++) {
				bytes += metadata.charCodeAt(i).toString(16).slice(-4);
			}
			const op = await contract.methods.mint(amount, bytes).send();
			await op.confirmation();
            dispatch(fetchData());
		} catch (e) {
			console.log(e);
		}
	};
};

export const collectNFT = ({ Tezos, amount, id }) => {
	return async (dispatch) => {
		try {
			const contract = await Tezos.wallet.at(config.contractAddress);

			const op = await contract.methods
				.collect(id)
				.send({ mutez: true, amount: amount });
			await op.confirmation();
            dispatch(fetchData());
		} catch (e) {
			console.log(e);
		}
	};
};