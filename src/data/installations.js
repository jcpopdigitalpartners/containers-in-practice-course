const apt = 'sudo apt-get update\nsudo apt-get install -y podman buildah skopeo git curl less unzip ca-certificates gnupg';
const download = "curl --proto '=https' --tlsv1.2 -fsSL https://get.opentofu.org/install-opentofu.sh -o install-opentofu.sh";
const tofu = method => `less install-opentofu.sh\nchmod +x install-opentofu.sh\n./install-opentofu.sh --install-method ${method}\nrm -f install-opentofu.sh`;
const verify = 'podman --version\nbuildah --version\nskopeo --version\ntofu version\ngit --version\ncurl --version\npodman run --rm quay.io/podman/hello';
const linuxSteps = (shell, rpm = false) => [
 {title:'Install the distribution packages',shell,note:rpm?'RHEL needs registered, enabled repositories. Follow your organization’s package policy.':'Use a supported Ubuntu release. Run the remaining steps in this Linux shell.',code:rpm?'sudo dnf install -y podman buildah skopeo git curl less unzip ca-certificates':apt},
 {title:'Download the OpenTofu installer',shell,note:'Download first so you can inspect what will run.',code:download},
 {title:'Review, then install OpenTofu',shell,note:'Read the script in less; press q to leave the reader. Run the following lines only after reviewing it. The installer may ask for sudo access.',code:tofu(rpm?'rpm':'deb')},
 {title:'Verify all six tools and the runtime',shell,note:'Version checks confirm the programs exist. The hello container also checks image retrieval and container execution. If it fails, resolve the reported runtime or network issue before continuing.',code:verify}
];
export const installations = [
 {id:'ubuntu',title:'Ubuntu / existing Ubuntu WSL2',intro:'Already inside Ubuntu? Install here. On Windows without WSL2, choose the Windows path first.',steps:linuxSteps('Ubuntu Bash'),sources:[['Ubuntu packages','https://podman.io/docs/installation'],['OpenTofu Debian installer','https://opentofu.org/docs/intro/install/deb/']]},
 {id:'rhel',title:'RHEL / Fedora',intro:'Use Bash on your RHEL or Fedora workstation. All six tools stay in the same Linux environment.',steps:linuxSteps('Linux Bash',true),sources:[['Linux container tools','https://podman.io/docs/installation'],['OpenTofu RPM installer','https://opentofu.org/docs/intro/install/rpm/']]},
 {id:'mac',title:'macOS',intro:'Use an Ubuntu guest for the complete Linux toolchain, including Buildah. Keep the project and all lab commands inside that guest.',steps:[
  {title:'Install Lima on your Mac',shell:'macOS Terminal',note:'These commands assume Homebrew is installed. If it is missing, use the official Homebrew installation guide below first.',code:'brew update\nbrew install lima'},
  {title:'Create and enter the Ubuntu guest',shell:'macOS Terminal',note:'This creates a new guest with 4 CPUs, 8 GiB RAM and a 40 GiB virtual disk for Modules 0–1. Your host needs additional resources for macOS. For the full course, plan 8 CPUs, 16–32 GiB guest RAM and 40–80 GiB free storage. Virtual disk capacity is not a guarantee of free host space.',code:'limactl start --name=course-linux --cpus=4 --memory=8 --disk=40 --containerd=none template:ubuntu\nlimactl shell course-linux\ncd "$HOME"\npwd'},
  ...linuxSteps('Ubuntu guest Bash')],sources:[['Homebrew installation','https://brew.sh/'],['Lima installation','https://lima-vm.io/docs/installation/'],['Lima guest options','https://lima-vm.io/docs/reference/limactl_start/'],['OpenTofu Debian installer','https://opentofu.org/docs/intro/install/deb/']]},
 {id:'windows',title:'Windows',intro:'Use WSL2 and Ubuntu. PowerShell prepares the environment; Ubuntu Bash runs the tools and labs.',steps:[
  {title:'Install Ubuntu with WSL2',shell:'PowerShell · Run as administrator',note:'Requires Windows 11 or Windows 10 version 2004/build 19041 or later. Restart if prompted, then complete Ubuntu’s first-run username and password setup. If Ubuntu is already installed, continue to the version check.',code:'wsl --install -d Ubuntu'},
  {title:'Check WSL and enter Ubuntu',shell:'PowerShell',note:'Confirm the Ubuntu row shows VERSION 2. If it shows 1, run wsl --set-version Ubuntu 2 before entering Ubuntu.',code:'wsl --list --verbose\nwsl -d Ubuntu'},
  {title:'Keep the project in Linux',shell:'Ubuntu Bash',note:'Use the Linux home directory rather than a Windows-mounted project folder. Check the resources available inside WSL separately from the host.',code:'cd "$HOME"\npwd'},
  ...linuxSteps('Ubuntu Bash')],sources:[['Microsoft WSL installation','https://learn.microsoft.com/en-us/windows/wsl/install'],['OpenTofu Debian installer','https://opentofu.org/docs/intro/install/deb/']]}
];
export const toolJobs = [
 {tool:'Buildah',job:'Build',detail:'Build an OCI image from your application and its dependencies.'},
 {tool:'Podman',job:'Run',detail:'Run containers from images and manage their lifecycle.'},
 {tool:'Skopeo',job:'Inspect',detail:'Inspect or transfer images without running a container.'},
 {tool:'OpenTofu',job:'Declare',detail:'Declare infrastructure and compare the desired state with the current state.'},
 {tool:'Git',job:'Record',detail:'Record reviewable changes and return to earlier checkpoints.'},
 {tool:'curl',job:'Request',detail:'Send an HTTP request and examine the response.'}
];
